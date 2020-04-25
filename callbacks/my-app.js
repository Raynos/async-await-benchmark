'use strict'

const path = require('path')

const LevelDown = require('leveldown')

const pkgLock = JSON.stringify(require('../package-lock.json'))

let largeStr = ''
do {
  largeStr += pkgLock
} while (largeStr.length <= 8 * 1024)

/**
 * Respesent some application code.
 */
class MyApp {
  constructor () {
    this.leveldown = new LevelDown(path.join(__dirname, 'db'))
  }

  bootstrap (cb) {
    this.leveldown.open(cb)
  }

  getUser (req, cb) {
    this.leveldown.get(`user:${req.body.id}`, onRead)

    function onRead (err, buf) {
      if (err) {
        return cb(null, {
          statusCode: 500,
          body: 'Oops; db cannot read'
        })
      }

      const data = JSON.parse(buf.toString())

      cb(null, {
        statusCode: 200,
        body: data
      })
    }
  }

  createUser (req, cb) {
    if (!req.body.id) {
      return cb(null, {
        statusCode: 400,
        body: 'Missing req.body.id'
      })
    }

    if (!req.body.email) {
      return cb(null, {
        statusCode: 400,
        body: 'Missing req.body.email'
      })
    }

    this.leveldown.put(`user:${req.body.id}`, JSON.stringify({
      id: req.body.id,
      email: req.body.email,
      bigData: largeStr
    }), onWrite)

    function onWrite (err) {
      if (err) {
        return cb(null, {
          statusCode: 500,
          body: 'Oops db write failure'
        })
      }

      cb(null, {
        statusCode: 200,
        body: ''
      })
    }
  }
}

module.exports = MyApp
