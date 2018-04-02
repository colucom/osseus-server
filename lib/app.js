const express = require('express')
const app = express()

module.exports = function (config) {
  app.get('/', function (req, res) {
    res.send('Hello World')
  })
  return app
}
