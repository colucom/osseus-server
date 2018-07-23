const express = require('express')
const app = express()
const async = require('async')
const path = require('path')

const init = (config) => {
  const requestIP = (cb) => {
    app.use((req, res, next) => {
      var ip = req.get('X-Forwarded-For') || req.ip
      ip = ip.split(',')
      req.requestIP = ip[0]
      next()
    })

    cb()
  }

  const requestID = (cb) => {
    const requestIdHeader = config.osseus_server.request_id_header
    if (requestIdHeader) {
      const requestId = require('cc-request-id')
      app.use(requestId({reqHeader: requestIdHeader, resHeader: requestIdHeader}))
    }

    cb()
  }

  const maintenance = (cb) => {
    app.use((req, res, next) => {
      // check if maintenance mode is on
      if (config.osseus_server.maintenance_enabled !== 'true') return next()

      // allowed override header
      if (req.header('***REMOVED***')) return next()

      // allowed healthcheck urls
      if (['/', '/healthcheck', '/is_running'].indexOf(req.url) !== -1) return next()

      // allowed IP addresses
      let allowedIP = config.osseus_server.allowed_ip || ''
      if (allowedIP.split(',').indexOf(req.requestIP) !== -1) return next()

      // return maintenance message
      return res.status(499).send({error: config.osseus_server.maintenance_message})
    })

    cb()
  }

  const compression = (cb) => {
    const compressionEnabled = config.osseus_server.compresion_enabled === 'true'
    if (compressionEnabled) {
      const compression = require('compression')

      // https://github.com/expressjs/compression#level
      const compressionLevel = parseInt(config.osseus_server.compression_level || 6, 10)

      // https://github.com/expressjs/compression#filter
      const compressionFilter = (req, res) => {
        if (req.header['***REMOVED***']) {
          // don't compress responses with this request header
          return false
        }
        // fallback to standard filter function
        return compression.filter(req, res)
      }

      app.use(compression({level: compressionLevel, filter: compressionFilter}))
    }

    cb()
  }

  const cookieParser = (cb) => {
    const cookieParser = require('cookie-parser')
    app.use(cookieParser())

    cb()
  }

  const bodyParser = (cb) => {
    const bodyParser = require('body-parser')
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({extended: true}))

    cb()
  }

  const logging = (cb) => {
    const morgan = require('morgan')

    // https://github.com/expressjs/morgan#predefined-formats
    const morganFormat = config.osseus_server.morgan_format || 'tiny'

    morgan.token('host', (req, res) => {
      return req.get('Host')
    })

    morgan.token('client-ip', (req, res) => {
      return req.get('X-Forwarded-For') || req.requestIP || req.ip
    })

    morgan.token('route', (req, res) => {
      return (req.route && req.route.path) || '-'
    })

    const requestIdHeader = config.osseus_server.request_id_header
    if (requestIdHeader) {
      morgan.token('request-id', (req, res) => {
        return req.get(requestIdHeader) || res.get(requestIdHeader)
      })
    }

    // https://github.com/expressjs/morgan#immediate
    app.use(morgan(':date[iso] :method :url :route', {immediate: true}))

    app.use(morgan(morganFormat))

    cb()
  }

  const corsHandling = (cb) => {
    const cors = require('cors')

    // https://www.npmjs.com/package/cors#configuring-cors-w-dynamic-origin
    const whitelist = (config.osseus_server.cors_whitelist || '').split(',')
    const corsOptions = {
      origin: (origin, callback) => {
        const originIsWhitelisted = whitelist.indexOf(origin) !== -1
        callback(null, originIsWhitelisted)
      }
    }

    app.use('*', cors(corsOptions))

    cb()
  }

  const statics = (cb) => {
    const cwd = process.cwd()

    const engineType = config.osseus_server.static_engine_type
    const viewsFolder = config.osseus_server.views_folder ? path.join(cwd, config.osseus_server.views_folder) : ''
    const staticFolder = config.osseus_server.static_folder ? path.join(cwd, config.osseus_server.static_folder) : ''

    engineType && app.set('view engine', engineType)
    viewsFolder && app.set('views', viewsFolder)
    staticFolder && app.use(express.static(staticFolder))

    cb()
  }

  const healthcheck = (cb) => {
    ['/healthcheck', '/is_running'].forEach((endpoint) => {
      app.get(endpoint, (req, res, next) => {
        return res.send('OK')
      })
    })

    cb()
  }

  const errors = (cb) => {
    app.use((err, req, res, next) => {
      const status = err.status || (err.res && err.res.statusCode) || 500
      const error = config.env && config.env.toLowerCase() === 'production' ? err.message : err
      console.error(`ERROR! ${err}`)
      res.status(status).send({error: error})
    })
  }

  logging(() => {
    async.parallel([
      maintenance,
      requestIP,
      requestID,
      corsHandling,
      compression,
      cookieParser,
      bodyParser,
      statics,
      healthcheck,
      errors
    ], (err) => {
      if (err) {
        throw new Error(err)
      }
    })
  })
}

module.exports = (config) => {
  init(config)
  return app
}
