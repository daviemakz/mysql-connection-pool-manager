'use strict';

// MySQL Connection Pool

// Load modules
const AS = require('async');
const CR = require('crypto');

// Load custom modules
const PoolFunctions = require('./common.js');

// Declare class
class Core extends PoolFunctions {

  // Initial constructor
  constructor() {

    // Connection pool storage
    this.poolStorage;
    this.poolConnectionList = {};
    this.poolActivity = {};
    this.poolSettings = {};

    // Bind methods
    this.startPool = this.startPool.bind(this);
    this.currentSessionId = this.currentSessionId.bind(this);
    this.checkPoolStatus = this.checkPoolStatus.bind(this);
    this.getConnection = this.getConnection.bind(this);
    this.execute = this.execute.bind(this);
    this.query = this.query.bind(this);

  }

  // FUNCTION: Build settings hash
  currentSessionId() {
    return CR.createHash('md5')
      .update(JSON.stringify(this.options.mysqlSettings))
      .digest("hex");
  }

  // FUNCTION: Start connection pool
  startPool(callback) {
    // Invoke connection pool
    this.poolStorage = this.createPool(this.options.mysqlSettings);
    // Start connection pool monitor
    this.closeIdlePools(this.poolStorage, this.currentSessionId(), this.poolActivity
      , this.options.idleTimeout);
    // Start idle connection monitor
    this.closeIdleConnections(this.poolStorage, this.currentSessionId()
      , this.poolConnectionList);
    // Add to connection tracking
    this.poolStorage.on('connection', function(connection) {
      // Set hard wait timeout session limit
      connection.query(
        `SET SESSION wait_timeout = ${this.options.sessionTimeout}`
      );
      // Update timestamp...
      this.poolConnectionList[this.currentSessionId()][connection.threadId] =
        this.getTimestamp();
    });
    // Register connection pool settings
    this.poolSettings[this.currentSessionId()] = this.options.mysqlSettings;
    this.poolActivity[this.currentSessionId()] = 0;
    // Callback if nessesary
    if (typeof(callback) == 'function') {
      // Callback
      callback()
      // Return
      return;
    } else {
      // Return
      return;
    }
  }

  // FUNCTION: Check pool is active & settings are correct
  checkPoolStatus(cb) {
    // Check connection pool settings are the same for the active pool
    if (this.checkConnectionDetails(this.options.mysqlSettings, this.poolSettings[
      this.currentSessionId()]) || (!this.poolSettings[this.currentSessionId()])) {
      // Check the pool is active
      if (this.checkPool(this.poolStorage)) {
        // Callback
        cb();
      } else {
        // Start connection pool, wait slightly then move on...
        this.startPool(function() {
          setTimeout(function() {
            cb();
          }, this.options.preInitDelay);
        });
      }
    } else {
      // Close the connection pool
      this.closePool(this.poolStorage, function() {
        // Recheck the status
        this.startPool(function() {
          setTimeout(function() {
            this.checkPoolStatus(cb);
          }, this.options.preInitDelay);
        });
      });
    }
  }

  // FUNCTION: Get connection from pool
  getConnection(cb) {
    // Declare error tracking
    let errorTracking = 0;
    // Register query
    this.poolActivity[this.currentSessionId()]++;
    // Attempt to get connection
    this.poolStorage.getConnection(function(err, con) {
      // Check for errors getting the connection
      if (err) {
        if (this.options.errorLimit > errorTracking) {
          // Console log
          console.warn(`Initializing connection failed. MORE INFO: ${err} Retrying...`);
          // Track the failiure
          errorTracking++;
          // Try getting another connection?
          if (err.code == 'POOL_CLOSED') {
            this.startPool(function() {
              setTimeout(function() {
                this.getConnection(cb);
              }, this.options.errorLimit);
            });
          } else {
            setTimeout(function() {
              this.getConnection(cb);
            }, this.options.errorLimit);
          }
        } else {
          // Assign error message
          errorMessage = `Initializing connection failed. MORE INFO: ${err}`;
          // Callback a null object
          cb();
        }
      } else {
        // Update connection timestamp
        this.poolConnectionList[this.currentSessionId()][con.threadId] = this.getTimestamp();
        // Assign connection
        connection = con;
        // Callback to execution stage
        cb();
      }
    });
  };

  // FUNCTION: Execute query
  execute() {
    // Check connection is initialized...
    if (!(connection)) {
      if (typeof(returnCallback) == 'function') {
        returnCallback([], `Error getting connection object! MORE INFO: ${errorMessage}`);
        return;
      } else {
        return;
      };
    }
    // Start query execution..
    connection.query(sqlCommand, function(err, rows) {
      // Register query
      this.poolActivity[this.currentSessionId()]++;
      // Check for any errors
      if (err) {
        // Assign sql commands
        err.sql = sqlCommand;
        // Emit error
        this.emitQueryError(err);
        // Release connection
        connection.release();
        // Callback [ERROR]
        if (typeof(returnCallback) == 'function') {
          returnCallback([], `Error executing query! MORE INFO: ${err}`);
          return;
        } else {
          return;
        };
      } else {
        // Release connection
        connection.release();
        // Callback [SUCCESS]
        if (typeof(returnCallback) == 'function') {
          returnCallback(rows, undefined);
          return;
        } else {
          return;
        };
      }
    });
  }

  // FUNCTION: Execute query in services database
  query(command, callback) {
    // Define variables
    let errorMessage;
    let connection;
    let sqlCommand = command;
    let returnCallback = callback;
    // Start processing operation
    AS.series([
      this.checkPoolStatus
      , this.getConnection
      , this.execute
    ], function(error) {
      if (error) {
        console.warn(`Unknown error in async series stack. MORE INFO: ${error}`);
      };
    });
  }

}

// EXPORTS
module.exports = Core;
