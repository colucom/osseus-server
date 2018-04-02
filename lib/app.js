const express = require('express')
const app = express()
const async = require('async')

const init = function (config) {
  const requestIP = function (cb) {
    app.use((req, res, next) => {
      var ip = req.get('X-Forwarded-For') || req.ip
      ip = ip.split(',')
      req.requestIP = ip[0]
      next()
    })
    cb()
  }

  const maintanenceMode = function (cb) {
    app.use(function (req, res, next) {
      // check if maintanence mode is on
      if (config.get('MAINTENANCE') !== 'true') return next()

      // allowed override header
      if (req.header('***REMOVED***')) return next()

      // allowed healthcheck urls
      if (req.url === '/' || req.url === '/healthcheck' || req.url === '/is_running') return next()

      // allowed IP addresses
      let allowedIP = config.get('ALLOWED_IP') || ''
      if (allowedIP.split(',').indexOf(req.requestIP) !== -1) return next()

      // return maintanence message
      return res.status(499).send({error: config.get('MAINTENANCE_MESSAGE')})
    })
    cb()
  }

  const healthcheck = function (cb) {
    app.get('/healthcheck', function (req, res, next) {
      return res.send('OK')
    })
    app.get('/is_running', function (req, res, next) {
      return res.send('OK')
    })
    cb()
  }

  async.waterfall([
    requestIP,
    maintanenceMode,
    healthcheck
  ], (err) => {
    if (err) {
      throw new Error(err)
    }
  })
}

module.exports = function (config) {
  init(config)
  return app
}
