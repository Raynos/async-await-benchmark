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
