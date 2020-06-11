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

  const requestID = () => {
    const requestIdHeader = config.osseus_server.request_id_header
    if (requestIdHeader) {
      const requestId = require('cc-request-id')
      app.use(
        requestId({ reqHeader: requestIdHeader, resHeader: requestIdHeader })
      )
    }
  }

  const maintenance = (cb) => {
    app.use((req, res, next) => {
      // check if maintenance mode is on
      if (config.osseus_server.maintenance_enabled !== 'true') return next()

      // get the override header if exists
      const maintenanceOverrideHeader =
        config.osseus_server.maintenance_override_header

      // allowed override header
      if (maintenanceOverrideHeader && req.header[maintenanceOverrideHeader])
        return next()

      // allowed healthcheck urls
      if (['/', '/healthcheck', '/is_running'].indexOf(req.url) !== -1)
        return next()

      // allowed IP addresses
      let allowedIP = config.osseus_server.allowed_ip || ''
      if (allowedIP.split(',').indexOf(req.requestIP) !== -1) return next()

      // return maintenance message
      return res
        .status(499)
        .send({ error: config.osseus_server.maintenance_message })
    })

    cb()
  }

  const compression = (cb) => {
    const compressionEnabled =
      config.osseus_server.compresion_enabled === 'true'
    if (compressionEnabled) {
      const compression = require('compression')

      // https://github.com/expressjs/compression#level
      const compressionLevel = parseInt(
        config.osseus_server.compression_level || 6,
        10
      )

      const noCompressionHeader = config.osseus_server.no_compression_header

      // https://github.com/expressjs/compression#filter
      const compressionFilter = (req, res) => {
        if (noCompressionHeader && req.header[noCompressionHeader]) {
          return false
        }
        // fallback to standard filter function
        return compression.filter(req, res)
      }

      app.use(
        compression({ level: compressionLevel, filter: compressionFilter })
      )
    }

    cb()
  }

  const cookieParser = (cb) => {
    const cookieParser = require('cookie-parser')
    app.use(cookieParser())

    cb()
  }

  const bodyParser = (cb) => {

    const rawBody = (req, res, buf, encoding) => {
      req.rawBody = buf
    }

    const bodyParser = require('body-parser')
    app.use(bodyParser.json({limit: '5mb', verify: rawBody }))
    app.use(bodyParser.urlencoded({ limit: '5mb', extended: true, verify: rawBody }))

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
    app.use(morgan(':date[iso] :method :url :route', { immediate: true }))

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
      },
    }

    app.use('*', cors(corsOptions))

    cb()
  }

  const statics = (cb) => {
    const cwd = process.cwd()

    const engineType = config.osseus_server.static_engine_type
    const viewsFolder = config.osseus_server.views_folder
      ? path.join(cwd, config.osseus_server.views_folder)
      : ''
    const staticFolder = config.osseus_server.static_folder
      ? path.join(cwd, config.osseus_server.static_folder)
      : ''

    engineType && app.set('view engine', engineType)
    viewsFolder && app.set('views', viewsFolder)
    staticFolder && app.use(express.static(staticFolder))

    cb()
  }

  const healthcheck = (cb) => {
    const addHealthcheck = config.osseus_server.add_healthcheck
    const addIsRunning = config.osseus_server.add_is_running

    if (addHealthcheck) {
      app.get('/healthcheck', (req, res, next) => {
        return res.send('OK')
      })
    }

    if (addIsRunning) {
      app.get('/is_running', (req, res, next) => {
        return res.send('OK')
      })
    }

    cb()
  }

  const parallelMethodsExecution = () => {
    async.parallel(
      [
        maintenance,
        requestIP,
        corsHandling,
        compression,
        cookieParser,
        bodyParser,
        statics,
        healthcheck,
      ],
      (err) => {
        if (err) {
          throw new Error(err)
        }
      }
    )
  }

  // Create RequestID Middleware
  requestID()

  const shouldUseCustomLoggerMethod =
    config.osseus_server.should_use_custom_logging_method || false

  if (shouldUseCustomLoggerMethod) {
    const cwd = process.cwd()
    const loggerMethodPathValue =
      config.osseus_server.custom_logging_method_path
    if (loggerMethodPathValue) {
      const middlewarePath = path.join(cwd, loggerMethodPathValue)
      try {
        const loggingMethod = require(middlewarePath).default
        loggingMethod(app, config, () => {
          parallelMethodsExecution()
        })
      } catch (err) {
        // default logging method
        logging(() => {
          parallelMethodsExecution()
        })
      }
    } else {
      // default logging method
      logging(() => {
        parallelMethodsExecution()
      })
    }
  } else {
    // default logging method
    logging(() => {
      parallelMethodsExecution()
    })
  }
}

module.exports = (config) => {
  init(config)
  return app
}
