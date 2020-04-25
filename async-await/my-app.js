'use strict'

const path = require('path')

const LevelDown = require('leveldown')
const AsyncLevel = require('../vendor/async-level.js')

/**
 * Respesent some application code.
 */
class MyApp {
  constructor () {
    this.leveldown = new LevelDown(path.join(__dirname, 'db'))
    this.db = new AsyncLevel(this.leveldown, {
      encode: JSON.stringify,
      decode: JSON.parse
    })
  }

  async bootstrap () {
    await this.db.ensure()
  }

  async getUser (req) {
    const { err, data } = await this.db.get(`user:${req.body.id}`)
    if (err) {
      if (err.notFound) {
        return {
          statusCode: 404,
          body: 'Oops; could not find user: ' + req.body.id
        }
      }
      return {
        statusCode: 500,
        body: 'Oops; db cannot read'
      }
    }

    return {
      statusCode: 200,
      body: data
    }
  }

  async createUser (req) {
    if (!req.body.id) {
      return {
        statusCode: 400,
        body: 'Missing req.body.id'
      }
    }

    if (!req.body.email) {
      return {
        statusCode: 400,
        body: 'Missing req.body.email'
      }
    }

    const { err } = await this.db.put(`user:${req.body.id}`, {
      id: req.body.id,
      email: req.body.email
    })

    if (err) {
      return {
        statusCode: 500,
        body: 'Oops db write failure'
      }
    }

    return {
      statusCode: 200,
      body: ''
    }
  }
}

module.exports = MyApp
