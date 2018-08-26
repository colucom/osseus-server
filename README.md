[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

# Osseus Server

[express](https://github.com/expressjs/express) based osseus web server module

## Install
```bash
$ npm install osseus-server
```

## Usage

#### Configuration

Mandatory:

* `OSSEUS_SERVER_PORT`

Optional:

* `REQUEST_ID_HEADER`
	* set request id header name to enable [cc-request-id](https://www.npmjs.com/package/cc-request-id) middleware
* `MAINTENANCE_ENABLED`
	* set to `true` to enable maintenance mode on server
* `MAINTENANCE_MESSAGE`
	* maintenance message sent to clients when maintenance mode is enabled
* `MAINTENANCE_OVERRIDE_HEADER`
	* bypass maintenance mode with this header
* `ALLOWED_IP`
	* list of ip addresses allowed to bypass maintenance mode
* `COMPRESION_ENABLED`
	* set to `true` to enable [compression](https://github.com/expressjs/compression) middleware
* `COMPRESSION_LEVEL`
	* [compressions level](https://github.com/expressjs/compression#level) if compression is enabled
* `NO_COMPRESSION_HEADER`
	* don't compress responses with this request header
* `MORGAN_FORMAT`
	* format for [morgan](https://github.com/expressjs/morgan)
	* see [morgan predefined formats](https://github.com/expressjs/morgan#predefined-formats)
	* default is [tiny](https://github.com/expressjs/morgan#tiny)
* `CORS_WHITELIST`
	* [configuring CORS w/ dynamic origin](https://www.npmjs.com/package/cors#configuring-cors-w-dynamic-origin)
* `STATIC_ENGINE_TYPE`
* `VIEWS_FOLDER`
	* [use template engines](https://expressjs.com/en/guide/using-template-engines.html)
* `STATIC_FOLDER`
	* [serve static files](https://expressjs.com/en/starter/static-files.html)
* `ADD_HEALTHCHECK`
	* add `/healthcheck` endpoint which returns `OK` with status code 200
* `ADD_IS_RUNNING`
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
