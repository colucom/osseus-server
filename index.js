const path = require('path')

const request = require('request')
const intoStream = require('into-stream')

const { MoleculerError } = require('moleculer').Errors

const init = function (osseus) {
  this.osseus = osseus
  return new Promise(async (resolve, reject) => {
    const app = require(path.join(__dirname, '/lib/app'))(osseus.config)
    this.app = app

    // Load the osseus-moleculer-web module if needed
    const shouldUseMoleculerWebAsMiddleware =
      this.osseus.config.osseus_server.should_use_moleculer_web_as_middleware ||
      false
    if (shouldUseMoleculerWebAsMiddleware) {
      try {
        const OsseusMoleculerWeb = require('@colucom/osseus-moleculerweb')
        const moleculerObj = await OsseusMoleculerWeb.init(osseus)
        osseus['moleculer'] = moleculerObj.moleculer.broker

        this.moleculerWebService = moleculerObj.moleculer.service
      } catch (err) {
        console.log(`Crash Error: ${err}`)
      }
    }

    resolve(this)
  })
}

const start = function () {
  return new Promise((resolve, reject) => {
    // Load middelwares and add them to the express
    const cwd = process.cwd()
    const envMiddewaresValue = this.osseus.config.osseus_server.middlewares_path
    if (envMiddewaresValue) {
      try {
        const middlewaresPath = path.join(cwd, envMiddewaresValue)
        const middlewares = require(middlewaresPath).default
        for (const middleware of middlewares) {
          this.app.use(middleware)
        }
      } catch (err) {}
    }

    //Adding moleculer-web api gateway service as middleware to express if needed
    if (this.moleculerWebService) {
      this.app.use(this.moleculerWebService.express())
    }

    // Configure error middlewares
    let errorsMap
    const errorsMapConfigValue = this.osseus.config.osseus_server
      .errors_map_path
    if (errorsMapConfigValue) {
      try {
        const errorsMapPath = path.join(cwd, errorsMapConfigValue)
        errorsMap = require(errorsMapPath)
      } catch (err) {
        errorsMap = null
        console.log('Failed to load errors map file.')
      }
    }

    this.app.use((err, req, res, next) => {
      if (!err) {
        next()
      }

      try {
        this.app.logger.debug(`Error | ${JSON.stringify(err)}`)
      } catch (ex) {
        try {
          this.app.logger.debug(`Error Data | ${JSON.stringify(err.data)}`)
        } catch (e) {
          this.app.logger.debug(`Error(no stringify) | ${err}`)
        }
      }

      try {
        if (typeof err === 'string') {
          err = JSON.parse(err)
        }
      } catch (ex) {
        console.log('Failed to parse json')
      }

      if (err instanceof MoleculerError) {
        const name = (err.data && err.data.name) || 'MoleculerError'
        const code =
          (err.data && err.data.code) ||
          (errorsMap && errorsMap[err.code] && errorsMap[err.code].code) ||
          999999500
        console.warn(`Moleculer error occured. Name: ${name}, Code: ${code}`)

        next({
          message:
            (err.data && err.data.message) ||
            err.message ||
            'Moleculer error occured',
          name,
          status:
            (err.data && err.data.status) ||
            (errorsMap[err.code] && errorsMap[err.code].status) ||
            500,
          code,
        })
      } else {
        next(err.error || err)
      }
    })

    this.app.use((err, req, res, next) => {
      if (err && err.status) {
        let display = {
          message: err.message,
          name: err.name,
          status: err.status,
          code: err.code,
        }

        let response

        const smsCode =
          this.osseus.config.osseus_server.sms_err_code_prefix || 611
        if (err.code && err.code.toString().startsWith(smsCode)) {
          const smsError = {
            message: display.message,
            status: display.status,
          }
          response = { error: display, ...smsError }
        } else {
          response = { error: display }
        }

        console.error(
          'end of stack with status',
          JSON.stringify({ ...response, data: err.data })
        )

        res.status(err.status).send(response)
      } else {
        delete err.ctx
        console.error('end of stack error', err)
        res.status(500).send({ error: err })
      }
    })

    // Handle 404 Errors
    this.app.use((req, res, next) => {
      if (!this.osseus.config.redirect_base_url) {
        res.status(404).send({ error: '404 NOT FOUND' })
        return
      }

      console.info(
        `=> REDIRECT to ${this.osseus.config.redirect_base_url}${req.originalUrl}`
      )

      const stream = intoStream(req.rawBody || '')
      stream.method = req.method
      stream.headers = req.headers

      stream.pipe(
        request[req.method.toLowerCase()](
          `${this.osseus.config.redirect_base_url}${req.originalUrl}`
        )
      )
      .on('error', (err) => {
        console.info(err)
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.writeHead(500)
        res.end(
          (err && err.message) ||
            'An error occured while redirecting to community'
        )
      })
      .pipe(res) 
    })

    const port =
      this.osseus.config.osseus_server.port || this.osseus.config.port
    const server = this.app
      .listen(port, () => {
        console.info(`server is listening on port: ${server.address().port}`)
        this.server = server
        resolve()
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

module.exports = {
  init: init,
  start: start,
}
