"use strict"

// Load modules
const PoolManager = require('./../');

// An example options configuration
const options = {
  idleCheckInterval: 1000,
  maxConnextionTimeout: 30000,
  idlePoolTimeout: 3000,
  errorLimit: 5,
  preInitDelay: 50,
  sessionTimeout: 60000,
  onConnectionAcquire: () => {
    console.log("Acquire");
  },
  onConnectionConnect: () => {
    console.log("Connect");
  },
  onConnectionEnqueue: () => {
    console.log("Enqueue");
  },
  onConnectionRelease: () => {
    console.log("Release");
  },
  mySQLSettings: {
    host: 'localhost',
    user: 'root',
    password: 'Fire$man22choP',
    database: 't_dd_shop',
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
for (var i = 0; i < 20000; i++) {
    var count = i;
    mySQL.query(`INSERT INTO oc_product_reward VALUES (${count}, ${count}, ${count}, ${count});`,(res, msg) => {
      console.log(res,msg);
    });
}
