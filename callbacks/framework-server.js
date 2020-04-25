'use strict'

const URL = require('url').URL

const HTTPHash = require('http-hash')

const HTTPServer = require('./http-server.js')

/**
 * Represent a http framework.
 */
class FrameworkServer {
  constructor (port) {
    this.server = new HTTPServer(port, this)

    this.hash = new HTTPHash()
  }

  bootstrap (cb) {
    this.server.bootstrap(cb)
  }

  address () {
    return this.server.address()
  }

  all (route, handler) {
    this.hash.set(route, handler)
  }

  handle (req, res) {
    const url = new URL(req.url, 'http://localhost:8000')

    const route = this.hash.get(url.pathname)
    if (!route.handler) {
      res.statusCode = 404
      res.end('Not Found')
    }

    this.invokeRoute(req, res, url, route)
  }

  invokeRoute (req, res, url, route) {
    const fn = route.handler
    this.parseBody(req, url, onBody)

    function onBody (err, body) {
      if (err) {
        res.statusCode = 500
        return res.end('Cannot parse body')
      }

      fn({
        url: url,
        method: req.method,
        body: body
      }, onResponse)
    }

    function onResponse (err, plainRes) {
      if (err) {
        res.statusCode = 500
        return res.end('Unexpected server error')
      }

      res.statusCode = plainRes.statusCode
      res.end(JSON.stringify(plainRes.body))
    }
  }

  parseBody (req, url, cb) {
    if (req.method === 'GET') {
      const searchParams = url.searchParams

      const query = {}
      for (const k of searchParams.keys()) {
        query[k] = searchParams.get(k)
      }
      return cb(null, query)
    }

    let data = ''

    req.on('data', (buf) => {
      data += buf.toString()
    })

    req.on('end', () => {
      cb(null, JSON.parse(data))
    })
  }
}

module.exports = FrameworkServer
