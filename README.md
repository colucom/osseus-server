[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

# Osseus Server

[express](https://github.com/expressjs/express) based osseus web server module

## Install
```bash
$ npm install @colucom/osseus-server
```

## Usage with MOLECULER-WEB AS MIDDELWARE

#### Configuration

##### Mandatory:

To use the moleculer-web api gateway module as a middleware of the express, this configuration are mandatory.

* `OSSEUS_MOLECULERWEB_LOAD: false`
	* the init of the osseus module will be preformed as part of this module code and not in the init of the osseus it self.

* `OSSEUS_SERVER_SHOULD_USE_MOLECULER_WEB_AS_MIDDLEWARE: true`
	* this flag indicates to the module to use the moleculer-web osseus module.


##### Optional:

<u>Logging</u> 

To use custom logging as a middleware of the express, it's necessary to config this 2 configurations.

* ` OSSEUS_SERVER_SHOULD_USE_CUSTOM_LOGGING_METHOD: true`

* `OSSEUS_SERVER_CUSTOM_LOGGING_METHOD_PATH: 'Custom Path'`

	* the custom path of the logging middelware method in the original project that uses the osseus-server.

<u>Custom middlewares</u>

To use custom middelwares you should provide path to array of middleware functions.

* `OSSEUS_SERVER_MIDDLEWARES_PATH: 'Custom Path'`

	*  the custom path of the array of middelware functions in the original project that uses the osseus-server.

<u>Errors Map json</u>

To use custom errors map json you should provide path to this json.

* `OSSEUS_SERVER_ERRORS_MAP_PATH: 'Custom Path'`

<u>Handle 404 Errors - Redirect the request to another server</u>

If you wish to redirect the request to another server  when 404 not found error occures you should provide base url of this server.

* `REDIRECT_BASE_URL: 'Custom URL'`

## Usage

#### Configuration

Mandatory:

* `OSSEUS_SERVER_PORT`

Optional:

* `OSSEUS_SERVER_REQUEST_ID_HEADER`
	* set request id header name to enable [cc-request-id](https://www.npmjs.com/package/cc-request-id) middleware
* `OSSEUS_SERVER_MAINTENANCE_ENABLED`
	* set to `true` to enable maintenance mode on server
* `OSSEUS_SERVER_MAINTENANCE_MESSAGE`
	* maintenance message sent to clients when maintenance mode is enabled
* `OSSEUS_SERVER_MAINTENANCE_OVERRIDE_HEADER`
	* bypass maintenance mode with this header
* `OSSEUS_SERVER_ALLOWED_IP`
	* list of ip addresses allowed to bypass maintenance mode
* `OSSEUS_SERVER_COMPRESION_ENABLED`
	* set to `true` to enable [compression](https://github.com/expressjs/compression) middleware
* `OSSEUS_SERVER_COMPRESSION_LEVEL`
	* [compressions level](https://github.com/expressjs/compression#level) if compression is enabled
* `OSSEUS_SERVER_NO_COMPRESSION_HEADER`
	* don't compress responses with this request header
* `OSSEUS_SERVER_MORGAN_FORMAT`
	* format for [morgan](https://github.com/expressjs/morgan)
	* see [morgan predefined formats](https://github.com/expressjs/morgan#predefined-formats)
	* default is [tiny](https://github.com/expressjs/morgan#tiny)
* `OSSEUS_SERVER_CORS_WHITELIST`
	* [configuring CORS w/ dynamic origin](https://www.npmjs.com/package/cors#configuring-cors-w-dynamic-origin)
* `OSSEUS_SERVER_STATIC_ENGINE_TYPE`
* `OSSEUS_SERVER_VIEWS_FOLDER`
	* [use template engines](https://expressjs.com/en/guide/using-template-engines.html)
* `OSSEUS_SERVER_STATIC_FOLDER`
	* [serve static files](https://expressjs.com/en/starter/static-files.html)
* `OSSEUS_SERVER_ADD_HEALTHCHECK`
	* add `/healthcheck` endpoint which returns `OK` with status code 200
* `OSSEUS_SERVER_ADD_IS_RUNNING`
	* add `/is_running` endpoint which returns `OK` with status code 200


#### Example
First, create `index.js`:

```javascript
const Osseus = require('osseus')

const main = async () => {
	try {
		// init osseus
		const osseus = await Osseus.init()
  	} catch (err) {
		console.error(err)
  	}
}

main()

```

Running:

```bash
$ node index.js --OSSEUS_SERVER_PORT 8080
```

Will result in:

```sh
server is listening on port: 8080
```

## Contributing
Please see [contributing guidelines](https://github.com/colucom/osseus-server/blob/master/.github/CONTRIBUTING.md).

## License
Code released under the [MIT License](https://github.com/colucom/osseus-server/blob/master/LICENSE).
