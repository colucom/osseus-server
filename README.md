# Osseus Server

Osseus [express](https://github.com/expressjs/express) based web server

### Install
```bash
$ npm install osseus-server
```

### Usage
```bash
const OsseusServer = require('osseus-server')

const app = await OsseusServer.init(config)
```

#### Config
config should have a "get" function which receives the key name and returns the value

* `PORT` - port to listen on
