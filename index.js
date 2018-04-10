const path = require('path')

const init = function (osseus) {
  this.osseus = osseus
  const config = osseus.config
  return new Promise((resolve, reject) => {
    config.get = function (key) {
      return config.osseus_server[key.toLowerCase()] || config[key.toLowerCase()]
    }
    const app = require(path.join(__dirname, '/lib/app'))(config)
    this.app = app
    resolve(this)
  })
}

const start = async function () {
  const config = this.osseus.config
  const port = config.osseus_server.port || config.port
  const server = await this.app.listen(port)
  console.info(`server is listening on port: ${server.address().port}`)
  this.server = server
}

module.exports = {
  init: init,
  start: start
}
