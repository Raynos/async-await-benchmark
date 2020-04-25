const http = require('http')
const util = require('util')
const URL = require('url').URL
const path = require('path')

const LevelDown = require('leveldown')
const AsyncLevel = require('./vendor/async-level.js')
const HTTPHash = require('http-hash')

/**
 * Represents a low level HTTP server library.
 */
class HTTPServer {
  constructor (port, handler) {
    this.port = port
    this.handler = handler

    this.server = http.createServer((req, res) => {
      this.onRequest(req, res)
    })
  }

  async bootstrap () {
    await util.promisify((cb) => {
      this.server.listen(this.port, cb)
    })()
  }

  address () {
    return this.server.address()
  }

  onRequest (req, res) {
    this.handler.handle(req, res)
      .catch((err) => {
        console.error('promise error oops', err)

        res.statusCode = 500
        res.end('Unexpected error')
      })
  }
}

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

/**
 * Represent a real app. For example using a HTTP framework
 * and importing the application business logic.
 *
 * Then mounting two routes onto the server.
 * These two endpoints do reads and writes to levelDB
 */
async function main () {
  const server = new FrameworkServer(8000)
  await server.bootstrap()

  const myApp = new MyApp()
  await myApp.bootstrap()

  server.all('/get-user', (req) => {
    return myApp.getUser(req)
  })
  server.all('/create-user', (req) => {
    return myApp.createUser(req)
  })

  console.log('pid', process.pid, process.version)
  console.log('server listening', server.address())
}

if (require.main === module) {
  process.on('unhandledRejection', (err) => {
    process.nextTick(() => { throw err })
  })
  main()
}
