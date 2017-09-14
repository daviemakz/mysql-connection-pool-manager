'use strict';

// Load modules
const Async = require('async');
const MD5Hash = require('md5');

// Load custom modules
const PoolFunctions = require('./common.js');

// Declare class
class Core extends PoolFunctions {
  // Initial constructor
  constructor() {
    // Allow access to 'this'
    super();

    // Instance settings
    this.poolActivity = {};
    this.poolConnectionList = {};
    this.poolSettings = {};
    this.poolStorage = undefined;

    // Bind methods
    this.assignEventListeners = this.assignEventListeners.bind(this);
    this.checkPoolStatus = this.checkPoolStatus.bind(this);
    this.closePoolNow = this.closePoolNow.bind(this);
    this.currentSessionId = this.currentSessionId.bind(this);
    this.execute = this.execute.bind(this);
    this.getConnection = this.getConnection.bind(this);
    this.query = this.query.bind(this);
    this.startPool = this.startPool.bind(this);
  }

  // FUNCTION: Build settings hash
  currentSessionId() {
    return MD5Hash(JSON.stringify(this.options.mySQLSettings));
  }

  // FUNCTION: Close connection pool now
  closePoolNow(cb) {
    this.poolStorage.end(cb);
  }

  // FUNCTION: Assign event listeners
  assignEventListeners() {
    // Add to connection tracking
    this.poolStorage.on('connection', connection => {
      // Assign `onConnectionAcquire` if defined
      typeof this.options.onConnectionConnect === 'function' &&
        this.options.onConnectionConnect(connection);
      // Set hard wait timeout session limit
      connection.query(
        `SET SESSION wait_timeout = ${this.options.sessionTimeout}`
      );
      // Update timestamp...
      !this.poolConnectionList[this.currentSessionId()] &&
        (() => {
          this.poolConnectionList[this.currentSessionId()] = {};
        })();
      this.poolConnectionList[this.currentSessionId()][
        connection.threadId
      ] = this.getTimestamp();
    });
    // Assign `onConnectionAcquire` if defined
    typeof this.options.onConnectionAcquire === 'function' &&
      this.poolStorage.on('acquire', connection => {
        this.options.onConnectionAcquire(connection);
      });
    // Assign `onConnectionEnqueue` if defined
    typeof this.options.onConnectionEnqueue === 'function' &&
      this.poolStorage.on('enqueue', () => {
        this.options.onConnectionEnqueue();
      });
    // Assign `onConnectionRelease` if defined
    typeof this.options.onConnectionRelease === 'function' &&
      this.poolStorage.on('release', connection => {
        this.options.onConnectionRelease(connection);
      });
  }

  // FUNCTION: Start connection pool
  startPool(callback) {
    // Invoke connection pool
    this.poolStorage = this.createPool(this.options.mySQLSettings);
    // Start connection pool monitor
    this.closeIdlePools(
      this.poolStorage,
      this.currentSessionId(),
      this.poolActivity,
      this.options.idlePoolTimeout
    );
    // Start idle connection monitor
    this.closeIdleConnections(
      this.poolStorage,
      this.currentSessionId(),
      this.poolConnectionList
    );
    // Assign event listeners to pool
    this.assignEventListeners();
    // Register connection pool settings
    this.poolSettings[this.currentSessionId()] = this.options.mySQLSettings;
    // Set connection activity to 0
    this.poolActivity[this.currentSessionId()] = 0;
    // Callback if nessesary
    if (typeof callback === 'function') {
      // Callback
      return callback();
    } else {
      // Return
      return;
    }
  }

  // FUNCTION: Check pool is active & settings are correct
  checkPoolStatus(cb, scope) {
    // Check connection pool settings are the same for the active pool
    if (
      this.checkConnectionDetails(
        this.options.mySQLSettings,
        this.poolSettings[this.currentSessionId()]
      ) ||
      !this.poolSettings[this.currentSessionId()]
    ) {
      // Check the pool is active
      if (this.checkPool(this.poolStorage)) {
        // Callback
        return cb();
      } else {
        // Start connection pool, wait slightly then move on...
        this.startPool(() => {
          setTimeout(() => {
            return cb();
          }, this.options.preInitDelay);
        });
      }
    } else {
      // Close the connection pool
      this.closePool(this.poolStorage, () => {
        // Recheck the status
        this.startPool(() => {
          setTimeout(() => {
            this.checkPoolStatus(cb, scope);
          }, this.options.preInitDelay);
        });
      });
    }
  }

  // FUNCTION: Get connection from pool
  getConnection(cb, scope) {
    // Register query
    this.poolActivity[this.currentSessionId()]++;
    // Attempt to get connection
    this.poolStorage.getConnection((err, con) => {
      // Check for errors getting the connection
      if (err) {
        if (this.options.errorLimit > scope.errorTracking) {
          // Track the failiure
          scope.errorTracking++;
          // Try getting another connection?
          if (err.code === 'POOL_CLOSED') {
            this.startPool(() => {
              setTimeout(() => {
                this.getConnection(cb, scope);
              }, this.options.errorLimit);
            });
          } else if (err.code === 'POOL_ENQUEUELIMIT') {
            // Assign error message
            scope.errorMessage = {
              internalMsg: `Query limit reached, try increasing this value! MORE INFO: ${JSON.stringify(
                err
              )}`,
              err: err,
            };
            // Callback a null object
            return cb();
          } else {
            setTimeout(() => {
              this.getConnection(cb, scope);
            }, this.options.errorLimit);
          }
        } else {
          // Assign error message
          scope.errorMessage = {
            internalMsg: `Initializing connection failed. MORE INFO: ${JSON.stringify(
              err
            )}`,
            err: err,
          };
          // Callback a null object
          return cb();
        }
      } else {
        // Update connection timestamp
        this.poolConnectionList[this.currentSessionId()][
          con.threadId
        ] = this.getTimestamp();
        // Assign connection
        scope.connection = con;
        // Callback to execution stage
        return cb();
      }
    });
  }

  // FUNCTION: Execute query
  execute(cb, scope) {
    // Check connection is initialized...
    if (!scope.connection) {
      if (typeof scope.returnCallback === 'function') {
        scope.returnCallback([], scope.errorMessage);
        return;
      } else {
        return;
      }
    }
    // Start query execution..
    scope.connection.query(scope.sqlCommand, (err, rows) => {
      // Register query
      this.poolActivity[this.currentSessionId()]++;
      // Check for any errors
      if (err) {
        // Assign sql commands
        err.sql = scope.sqlCommand;
        // Release connection
        scope.connection.release();
        // Callback [ERROR]
        if (typeof scope.returnCallback === 'function') {
          scope.returnCallback([], err);
          return;
        } else {
          return;
        }
      } else {
        // Release connection
        scope.connection.release();
        // Callback [SUCCESS]
        if (typeof scope.returnCallback === 'function') {
          scope.returnCallback(rows, {});
          return;
        } else {
          return;
        }
      }
    });
  }

  // FUNCTION: Execute query in services database
  query(command, callback) {
    // Scope...
    const scope = {
      connection: '',
      errorMessage: '',
      sqlCommand: command,
      returnCallback: callback,
      errorTracking: 0,
    };

    // Execute series
    setTimeout(
      scope => {
        Async.series(
          [
            callback => {
              this.checkPoolStatus(callback, scope);
            },
            callback => {
              this.getConnection(callback, scope);
            },
            callback => {
              this.execute(callback, scope);
            },
          ],
          error => {
            if (error) {
              console.warn(
                `Unknown error in async series stack. MORE INFO: ${JSON.stringify(
                  error
                )}`
              );
            }
          }
        );
      },
      0,
      scope
    );
  }
}

// EXPORTS
module.exports = Core;
