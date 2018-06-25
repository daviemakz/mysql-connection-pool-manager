'use strict';

// Load assertions & framework
const Assert = require('assert');
const Promise = require('bluebird');
const Chai = require('chai');

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
    queueLimit: 5000,
    debug: false,
  },
};

// Initialising the instance
const mySQL = PoolManager(options);

describe('instance', function() {
  // Check properties
  [
    'raw',
    'checkConnectionDetails',
    'checkPool',
    'checkTimestamp',
    'closeIdleConnections',
    'closeConnection',
    'closePool',
    'createPool',
    'escapeValue',
    'getTimestamp',
    'poolActivity',
    'poolConnectionList',
    'poolSettings',
    'poolStorage',
    'assignEventListeners',
    'checkPoolStatus',
    'closePoolNow',
    'currentSessionId',
    'execute',
    'getConnection',
    'query',
    'startPool',
    'config',
    'options',
  ].forEach(prop => {
    it(`checking instance property: ${prop}`, function() {
      return new Promise(function(resolve, reject) {
        mySQL.hasOwnProperty(prop)
          ? resolve()
          : reject(`property not found: ${prop}`);
      });
    });
  });
});
