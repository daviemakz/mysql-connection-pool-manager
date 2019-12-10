# MySQL Connection Pool Manager

[![Greenkeeper badge](https://badges.greenkeeper.io/daviemakz/mysql-connection-pool-manager.svg)](https://greenkeeper.io/)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fdaviemakz%2Fmysql-connection-pool-manager.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fdaviemakz%2Fmysql-connection-pool-manager?ref=badge_shield)

[![NPM](https://nodei.co/npm/mysql-connection-pool-manager.png?compact=true)](https://www.npmjs.com/package/mysql-connection-pool-manager)

[![Build Status](https://travis-ci.org/daviemakz/mysql-connection-pool-manager.svg?branch=master)](https://travis-ci.org/daviemakz/mysql-connection-pool-manager)
[![Downloads](https://img.shields.io/npm/dm/mysql-connection-pool-manager.svg)](https://www.npmjs.com/package/mysql-connection-pool-manager)
[![Dependencies Status](https://david-dm.org/daviemakz/mysql-connection-pool-manager/status.svg)](https://david-dm.org/daviemakz/mysql-connection-pool-manager)
[![Development Dependencies Status](https://david-dm.org/daviemakz/mysql-connection-pool-manager/dev-status.svg)](https://david-dm.org/daviemakz/mysql-connection-pool-manager?type=dev)

This is a production level Node.JS mySQL connection pool wrapper powered by [mysqljs/mysql](https://github.com/mysqljs/mysql).

_Supports Node 8.x +_

# Summary

This module allows for intelligent management &amp; load balancing of mySQL connection pools. It is written in JavaScript, does not require compiling, and is MIT licensed. Its designed to be used by persistent and self-terminating processes.

# Installation

To use this module ensure you have installed the [mysqljs/mysql](https://github.com/mysqljs/mysql) module (if you haven’t already):

    npm install mysql@2.x --save

Aftewards install this module normally:

    npm install mysql-connection-pool-manager --save

Please note, currently this module supports: **[mysqljs/mysql](https://github.com/mysqljs/mysql) @ >= 2.14.0 < 3.0.0**

# Features

This module is designed to be highly flexible with exported internal functions which you can utilise to create your own custom scripts or change the behaviour of the module. The module supports instancing so you can create as many as you want. You could even setup a JavaScript powered mySQL cluster where your application natively load balances between two instances, the possibilities are endless.

- Fully powered by [mysqljs/mysql](https://github.com/mysqljs/mysql) under the hood.
- Will automatically close all connections after an elapsed time, allowing scripts to exit properly.
- Intelligent and configurable connection management, load balancing & termination.
- Highly customisable instance which allows changes in instance configuration after initialisation.
- Ability to change mySQL settings during execution, module will connect on next query database.
- Lightning fast query response time due to keeping connections primed for the next request.
- Completely asynchronous so no thread blocking & can handle high throughput situations.
- Extensively mocha tested and already in use in a production environment.

# Detailed Description

Using the standard `mysql.createPool()`, connections are lazily created by the pool. If you configure the pool to allow up to 100 connections, but only ever use 5 simultaneously, only 5 connections will be made. However if you configure it for 500 connections and use all 500 they will **remain open** for the durations of the process, even if they are idle!

This means if your MySQL Server `max_connections` is 510 your system will only have **10** mySQL connections available until your MySQL Server closes them (depends on what you have set your `wait_timeout` to) or your application closes! The only way to free them up is to manually close the connections via the pool instance or close the pool.

This module was created to fix this issue and **automatically** scale the number of connections dependant on the load. Inactive connections are closed and idle connection pools are eventually closed if there has not been any activity.

When a new query comes in, the pool is automatically initialised if its been closed and remains so as long as its in use. All this happens under the hood so they is no need to do anything but perform queries as you would normally. There is also no need to invest too heavily into flow control as this is taken care of by the module.

# MySQL Configuration Options

When establishing a connection, you can set the following options:

- `host`: The hostname of the database you are connecting to. (Default:
  `localhost`)
- `port`: The port number to connect to. (Default: `3306`)
- `localAddress`: The source IP address to use for TCP connection. (Optional)
- `socketPath`: The path to a unix domain socket to connect to. When used `host`
  and `port` are ignored.
- `user`: The MySQL user to authenticate as.
- `password`: The password of that MySQL user.
- `database`: Name of the database to use for this connection (Optional).
- `charset`: The charset for the connection. This is called "collation" in the SQL-level
  of MySQL (like `utf8_general_ci`). If a SQL-level charset is specified (like `utf8mb4`)
  then the default collation for that charset is used. (Default: `'UTF8_GENERAL_CI'`)
- `timezone`: The timezone configured on the MySQL server. This is used to type cast server date/time values to JavaScript `Date` object and vice versa. This can be `'local'`, `'Z'`, or an offset in the form `+HH:MM` or `-HH:MM`. (Default: `'local'`)
- `connectTimeout`: The milliseconds before a timeout occurs during the initial connection
  to the MySQL server. (Default: `10000`)
- `stringifyObjects`: Stringify objects instead of converting to values. (Default: `false`)
- `insecureAuth`: Allow connecting to MySQL instances that ask for the old
  (insecure) authentication method. (Default: `false`)
- `typeCast`: Determines if column values should be converted to native
  JavaScript types. (Default: `true`)
- `queryFormat`: A custom query format function.
- `supportBigNumbers`: When dealing with big numbers (BIGINT and DECIMAL columns) in the database,
  you should enable this option (Default: `false`).
- `bigNumberStrings`: Enabling both `supportBigNumbers` and `bigNumberStrings` forces big numbers
  (BIGINT and DECIMAL columns) to be always returned as JavaScript String objects (Default: `false`).
  Enabling `supportBigNumbers` but leaving `bigNumberStrings` disabled will return big numbers as String
  objects only when they cannot be accurately represented with [JavaScript Number objects](http://ecma262-5.com/ELS5_HTML.htm#Section_8.5)
  (which happens when they exceed the [-2^53, +2^53] range), otherwise they will be returned as
  Number objects. This option is ignored if `supportBigNumbers` is disabled.
- `dateStrings`: Force date types (TIMESTAMP, DATETIME, DATE) to be returned as strings rather then
  inflated into JavaScript Date objects. Can be `true`/`false` or an array of type names to keep as
  strings. (Default: `false`)
- `debug`: Prints protocol details to stdout. Can be `true`/`false` or an array of packet type names
  that should be printed. (Default: `false`)
- `trace`: Generates stack traces on `Error` to include call site of library
  entrance ("long stack traces"). Slight performance penalty for most calls.
  (Default: `true`)
- `multipleStatements`: Allow multiple mysql statements per query. Be careful
  with this, it could increase the scope of SQL injection attacks. (Default: `false`)
- `flags`: List of connection flags to use other than the default ones. It is
  also possible to blacklist default ones.
- `ssl`: object with ssl parameters or a string containing name of ssl profile.
- `acquireTimeout`: The milliseconds before a timeout occurs during the connection
  acquisition. This is slightly different from `connectTimeout`, because acquiring
  a pool connection does not always involve making a connection. (Default: `10000`)
- `waitForConnections`: Determines the pool's action when no connections are
  available and the limit has been reached. If `true`, the pool will queue the
  connection request and call it when one becomes available. If `false`, the
  pool will immediately call back with an error. (Default: `true`)
- `connectionLimit`: The maximum number of connections to create at once.
  (Default: `10`)
- `queueLimit`: The maximum number of connection requests the pool will queue
  before returning an error from `getConnection`. If set to `0`, there is no
  limit to the number of queued connection requests. (Default: `0`)

_For a full list please visit this [link](https://github.com/mysqljs/mysql#connection-options)._

# Instance Configuration Options

Below are the options available to tweak the behaviour of the pool manager (in ms):

- `idleCheckInterval`: How often to check if connections are idle before closing them. _(required)_
- `maxConnextionTimeout`: The length of time to wait before connections are removed from the pool. _(required)_
- `idlePoolTimeout`: The length of time to wait before closing the connection pool if all connections are idle. _(required)_
- `errorLimit`: The number of times to attempt getting a connection / starting a connection pool.
- `preInitDelay`: How long to wait between attempts to initialise a connection pool. _(required)_
- `sessionTimeout`: Sets a mySQL `wait_timeout` on the connection session to close connections if your process blocks. _(required)_
- `onConnectionAcquire`: When a connection is _acquired_ from the pool. _(optional)_
- `onConnectionConnect`: When a new connection is _made_ within the pool. _(optional)_
- `onConnectionEnqueue`: When a query has been _queued_ to wait for an available connection. _(optional)_
- `onConnectionRelease`: When a connection is _released_ back to the pool. _(optional)_

# Available Methods

Here is a list of available methods:

- `checkPool(pool)`: Checks the status of the connection pool. Returns `boolean`.
- `closePool(pool)`: Closes the connection pool. Returns `undefined`.
- `closePoolNow(callback)`: Close the currently active connection pool. Returns `undefined`.
- `createPool(mySQLSettings)`: Creates a connection pool. Returns `instance`.
- `escapeValue(data)`: In order to avoid SQL injection attacks, you should always escape any user provided data. Returns `string`.
- `query(sql)`: This method allows you to perform a query. Returns `(result = [], error = {})`.
- `config(options)`: Allows you to change the instance / mySQL settings of an instance. Returns `undefined`.

You can also access the [mysqljs/mysql](https://github.com/mysqljs/mysql) directly like so...

```
"use strict"

// Load modules
const PoolManager = require('mysql-connection-pool-manager');

// Options
const options = {
  ...example settings
}

// Initialising the instance
const mySQL = PoolManager(options);

// Accessing mySQL directly
var connection = mySQL.raw.createConnection({
  host     : 'localhost',
  user     : 'me',
  password : 'secret',
  database : 'my_db'
});

// Initialising connection
connection.connect();

// Performing query
connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});

// Ending connection
connection.end();
```

...and you can still use the module normally!

# Basic Usage

## Simple Insertion Script

A simple script to bulk insert data into a table. Make sure you have an idea of how many connection you expect to queue at once and adjust your `queueLimit` accordingly. If this limit is reached the query callback will be called with an error.

```
"use strict"

// Load modules
const PoolManager = require('mysql-connection-pool-manager');

const options = {
  idleCheckInterval: 1000,
  maxConnextionTimeout: 30000,
  idlePoolTimeout: 3000,
  errorLimit: 5,
  preInitDelay: 50,
  sessionTimeout: 60000,
  onConnectionAcquire: () => { console.log("Acquire"); },
  onConnectionConnect: () => { console.log("Connect"); },
  onConnectionEnqueue: () => { console.log("Enqueue"); },
  onConnectionRelease: () => { console.log("Release"); },
  mySQLSettings: {
    host: 'localhost',
    user: 'me',
    password: 'secret',
    database: 'example_database',
    port: '3306',
    socketPath: '/var/run/mysqld/mysqld.sock',
    charset: 'utf8',
    multipleStatements: true,
    connectTimeout: 15000,
    acquireTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 1000,
    queueLimit: 5000,
    debug: false
  }
}

// Initialising the instance
const mySQL = PoolManager(options);

// Execute 30000 queries at once...
for (var i = 0; i < 30000; i++) {
    var count = i;
    mySQL.query(`INSERT INTO table_name VALUES (${count}, ${count}, ${count}, ${count});`,(res, msg) => {
      console.log(res,msg);
    });
}
```

# Contributing

All contributions are very welcome, please read my [CONTRIBUTING.md](https://github.com/daviemakz/mysql-connection-pool-manager/blob/master/CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/daviemakz/mysql-connection-pool-manager/pulls) or as [GitHub issues](https://github.com/daviemakz/mysql-connection-pool-manager/issues). If you'd like to improve code, please feel free!

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fdaviemakz%2Fmysql-connection-pool-manager.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fdaviemakz%2Fmysql-connection-pool-manager?ref=badge_large)
