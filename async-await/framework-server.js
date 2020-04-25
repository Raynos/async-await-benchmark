'use strict'

const util = require('util')
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

  async bootstrap () {
    return this.server.bootstrap()
  }

  address () {
    return this.server.address()
  }

  all (route, handler) {
    this.hash.set(route, handler)
  }

  async handle (req, res) {
    const url = new URL(req.url, 'http://localhost:8000')

    const route = this.hash.get(url.pathname)
    if (!route.handler) {
      res.statusCode = 404
      res.end('Not Found')
    }

    return this.invokeRoute(req, res, url, route)
  }

  async invokeRoute (req, res, url, route) {
    const fn = route.handler

    const body = await this.parseBody(req, url)

    const plainRes = await fn({
      url: url,
      method: req.method,
      body: body
    })

    res.statusCode = plainRes.statusCode
    res.end(JSON.stringify(plainRes.body))
  }

  async parseBody (req, url) {
    if (req.method === 'GET') {
      const searchParams = url.searchParams

      const query = {}
      for (const k of searchParams.keys()) {
        query[k] = searchParams.get(k)
      }
      return query
    }

    let data = ''

    req.on('data', (buf) => {
      data += buf.toString()
    })

    return util.promisify((cb) => {
      req.on('end', () => {
        cb(null, JSON.parse(data))
      })
    })()
  }
}

module.exports = FrameworkServer
