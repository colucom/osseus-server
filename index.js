const path = require('path')

const init = function (config) {
  const self = this
  return new Promise((resolve, reject) => {
    self.app = require(path.join(__dirname, '/lib/app'))(config)
    resolve(self.app)
  })
}

const start = async function (config) {
  const self = this
  const port = config.get('PORT')
  const server = await self.app.listen(port)
  return server
}

module.exports = {
  init: init,
  start: start
}
