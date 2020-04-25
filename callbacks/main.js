const FrameworkServer = require('./framework-server.js')
const MyApp = require('./my-app.js')

/**
 * Represent a real app. For example using a HTTP framework
 * and importing the application business logic.
 *
 * Then mounting two routes onto the server.
 * These two endpoints do reads and writes to levelDB
 */
async function main () {
  const server = new FrameworkServer(8000)
  const myApp = new MyApp()

  server.bootstrap(onServerStart)

  function onServerStart (err) {
    if (err) throw err

    myApp.bootstrap(onAppStart)
  }

  function onAppStart (err) {
    if (err) throw err

    server.all('/get-user', (req, cb) => {
      myApp.getUser(req, cb)
    })
    server.all('/create-user', (req, cb) => {
      myApp.createUser(req, cb)
    })

    console.log('pid', process.pid, process.version)
    console.log('server listening', server.address())
  }
}

if (require.main === module) {
  process.on('unhandledRejection', (err) => {
    process.nextTick(() => { throw err })
  })
  main()
}
