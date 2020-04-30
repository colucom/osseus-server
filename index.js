const path = require("path")

const init = function (osseus) {
  this.osseus = osseus
  return new Promise(async (resolve, reject) => {
    const app = require(path.join(__dirname, "/lib/app"))(osseus.config)
    this.app = app

    // Load the osseus-moleculer-web module if needed
    const shouldUseMoleculerWebAsMiddleware =
      this.osseus.config.osseus_server.should_use_moleculer_web_as_middleware ||
      false
    if (shouldUseMoleculerWebAsMiddleware) {
      try {
        const OsseusMoleculerWeb = require("@colucom/osseus-moleculerweb")
        const moleculerObj = await OsseusMoleculerWeb.init(osseus)
        osseus["moleculer"] = moleculerObj.moleculer.broker

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

    // Configure Logger as middleware

    // morgan...

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
      this.app.use("/api", this.moleculerWebService.express())
    }


    // Configure error middlewares
    // app.use((err, req, res, next))...

    const port =
      this.osseus.config.osseus_server.port || this.osseus.config.port
    const server = this.app
      .listen(port, () => {
        console.info(`server is listening on port: ${server.address().port}`)
        this.server = server
        resolve()
      })
      .on("error", (err) => {
        reject(err)
      })
  })
}

module.exports = {
  init: init,
  start: start,
}
