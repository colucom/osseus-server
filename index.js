const path = require('path')

const init = function (config) {
  return new Promise((resolve, reject) => {
    config.get = function (key) {
      return config.osseus_server[key.toLowerCase()] || config[key.toLowerCase()]
    }
    const app = require(path.join(__dirname, '/lib/app'))(config)
    this.app = app
    resolve(app)
  })
}

const start = async function (config) {
  const port = config.osseus_server.port || config.port
  const server = await this.app.listen(port)
  return server
}

module.exports = {
  init: init,
  start: start
}
