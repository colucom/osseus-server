const path = require('path')

const init = function (osseus) {
  this.osseus = osseus
  return new Promise((resolve, reject) => {
    const app = require(path.join(__dirname, '/lib/app'))(osseus.config)
    this.app = app
    resolve(this)
  })
}

const start = async function () {
  const port = this.osseus.config.osseus_server.port || this.osseus.config.port
  const server = await this.app.listen(port)
  console.info(`server is listening on port: ${server.address().port}`)
  this.server = server
}

module.exports = {
  init: init,
  start: start
}
