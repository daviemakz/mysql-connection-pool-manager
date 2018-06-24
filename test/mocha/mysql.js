'use strict';

// Load assertions & framework
const Promise = require('bluebird');

// Load module
const PoolManager = require('./../../');

// An example options configuration
const options = {
  idleCheckInterval: 1000,
  maxConnextionTimeout: 30000,
  idlePoolTimeout: 3000,
  errorLimit: 5,
  preInitDelay: 50,
  sessionTimeout: 60000,
  onConnectionAcquire: () => {},
  onConnectionConnect: () => {},
  onConnectionEnqueue: () => {},
  onConnectionRelease: () => {},
  mySQLSettings: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'database_test',
    port: '3306',
    socketPath: '/var/run/mysqld/mysqld.sock',
    charset: 'utf8',
    multipleStatements: true,
    connectTimeout: 15000,
    acquireTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 1000,
    queueLimit: 15000,
    debug: false,
  },
};

// Const Test Limit
const testLimit = 10000;

// Initialising the instance
const mySQL = PoolManager(options);

describe('mysql', function() {
  // Set variables
  var inc = 0;
  // Run before tests
  before(function(done) {
    // Count number of successes
    var completedQueries = 0;
    // Set timeout
    this.timeout(30000);
    // Put some stuff into the database
    for (var i = 0; i < testLimit; i++) {
      // Get count
      var count = i;
      // Perform query
      mySQL.query(
        `INSERT IGNORE INTO test_table VALUES (${count}, ${count});`,
        () => {
          // Increment completed queries
          completedQueries++;
          // Check if all is finished then contine test
          testLimit === completedQueries && done();
        }
      );
    }
  });
  // Build test cases
  for (var i = 0; i < testLimit; i++) {
    // Set timeout
    this.timeout(30000);
    // Start tests
    it(`connection query number: #${i}`, function() {
      return new Promise(function(resolve, reject) {
        // Increment count
        var curInc = inc++;
        // Return new promise
        mySQL.query(
          `SELECT * FROM test_table WHERE column_one=${curInc};`,
          (res, msg) => {
            res.length > 0 ? resolve() : reject(msg);
          }
        );
      });
    });
  }
});
