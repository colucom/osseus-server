# Osseus Server

Osseus [express](https://github.com/expressjs/express) based web server

### Install
```bash
$ npm install osseus-server
```

### Usage
```bash
const app = await OsseusServer.init(config)
const server = await OsseusServer.start(config)
console.log(`server is listening on port: ${server.address().port}`)
```

#### Config
config should have a "get" function which receives the key name and returns the value

* `OSSEUS_SERVER_PORT` - port to listen on
