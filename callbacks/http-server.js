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

  bootstrap (cb) {
    const self = this

    this.server.on('request', handleRequest)
    this.server.listen(this.port, cb)

    function handleRequest (req, res) {
      self.onRequest(req, res)
    }
  }

  address () {
    return this.server.address()
  }

  onRequest (req, res) {
    this.handler.handle(req, res)
  }
}

module.exports = HTTPServer
