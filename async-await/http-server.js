const util = require('util')
const http = require('http')

/**
 * Represents a low level HTTP server library.
 */
class HTTPServer {
  constructor (port, handler) {
    this.port = port
    this.handler = handler

    this.server = http.createServer()
  }

  async bootstrap () {
    const self = this

    this.server.on('request', handleRequest)
    await util.promisify((cb) => {
      this.server.listen(this.port, cb)
    })()

    function handleRequest (req, res) {
      self.onRequest(req, res)
    }
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

module.exports = HTTPServer
