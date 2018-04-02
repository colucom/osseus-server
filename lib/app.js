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

  const requestID = function (cb) {
    const requestId = require('cc-request-id')
    app.use(requestId({reqHeader: '***REMOVED***', resHeader: '***REMOVED***'}))

    cb()
  }

  const maintenance = function (cb) {
    app.use((req, res, next) => {
      // check if maintenance mode is on
      if (config.get('MAINTENANCE') !== 'true') return next()

      // allowed override header
      if (req.header('***REMOVED***')) return next()

      // allowed healthcheck urls
      if (['/', '/healthcheck', '/is_running'].indexOf(req.url) !== -1) return next()

      // allowed IP addresses
      let allowedIP = config.get('ALLOWED_IP') || ''
      if (allowedIP.split(',').indexOf(req.requestIP) !== -1) return next()

      // return maintenance message
      return res.status(499).send({error: config.get('MAINTENANCE_MESSAGE')})
    })

    cb()
  }

  const compression = function (cb) {
    const compression = require('compression')

    // https://github.com/expressjs/compression#level
    const compressionLevel = parseInt(config.get('COMPRESSION_LEVEL') || 6, 10)

    // https://github.com/expressjs/compression#filter
    const compressionFilter = function (req, res) {
      if (req.header['***REMOVED***']) {
        // don't compress responses with this request header
        return false
      }
      // fallback to standard filter function
      return compression.filter(req, res)
    }

    app.use(compression({level: compressionLevel, filter: compressionFilter}))
    cb()
  }

  const cookieParser = function (cb) {
    const cookieParser = require('cookie-parser')
    app.use(cookieParser())

    cb()
  }

  const bodyParser = function (cb) {
    const bodyParser = require('body-parser')
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({extended: true}))

    cb()
  }

  const logging = function (cb) {
    const morgan = require('morgan')

    // https://github.com/expressjs/morgan#predefined-formats
    const morganFormat = config.get('MORGAN_FORMAT') || 'tiny'

    morgan.token('host', (req, res) => {
      return req.get('Host')
    })

    morgan.token('client-ip', (req, res) => {
      return req.get('X-Forwarded-For') || req.requestIP || req.ip
    })

    morgan.token('route', (req, res) => {
      return (req.route && req.route.path) || '-'
    })

    // https://github.com/expressjs/morgan#immediate
    app.use(morgan(':method :url :route', {immediate: true}))

    app.use(morgan(morganFormat))

    // TODO check why ***REMOVED*** is empty in log

    cb()
  }

  const healthcheck = function (cb) {
    ['/healthcheck', '/is_running'].forEach((endpoint) => {
      app.get(endpoint, (req, res, next) => {
        return res.send('OK')
      })
    })

    cb()
  }

  async.waterfall([
    logging,
    maintenance,
    requestIP,
    requestID,
    compression,
    cookieParser,
    bodyParser,
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
