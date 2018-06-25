'use strict';

// Load NPM modules
const aysnc = require('async');
const md5Hash = require('md5');

// Load custom modules
const PoolManagerFunctions = require('./common.js');

// Declare class
class PoolManagerCore extends PoolManagerFunctions {
  // Initial constructor
  constructor() {
    // Allow access to 'this'
    super();
    // Instance pool storage
    this.poolStorage = void 0;
    // Instance settings
    ['poolActivity', 'poolConnectionList', 'poolSettings'].forEach(
      prop => (this[prop] = {})
    );
    // Bind methods
    return [
      'assignEventListeners',
      'checkPoolStatus',
      'closePoolNow',
      'currentSessionId',
      'execute',
      'getConnection',
      'query',
      'startPool',
    ].forEach(func => (this[func] = this[func].bind(this)));
  }

  // FUNCTION: Build settings hash
  currentSessionId() {
    return md5Hash(JSON.stringify(this.options.mySQLSettings));
  }

  // FUNCTION: Close connection pool now
  closePoolNow(cb) {
    return this.poolStorage.end(cb);
  }

  // FUNCTION: Assign event listeners
  assignEventListeners() {
    // Add to connection tracking
    this.poolStorage.on('connection', connection => {
      // Set hard wait timeout session limit
      connection.query(
        `SET SESSION wait_timeout = ${this.options.sessionTimeout}`
      );
      // Check if connection tracking list exists...
      !this.poolConnectionList[this.currentSessionId()] &&
        (this.poolConnectionList[this.currentSessionId()] = {});
      // Assign timestamp..
      this.poolConnectionList[this.currentSessionId()][
        connection.threadId
      ] = this.getTimestamp();
      // Assign `onConnectionConnect` if defined
      return typeof this.options.onConnectionConnect === 'function'
        ? this.options.onConnectionConnect(connection)
        : void 0;
    });
    // Assign connection event listeners if defined
    return ['acquire', 'enqueue', 'release'].forEach(
      event =>
        typeof this.options[
          `onConnection${event.charAt(0).toUpperCase() + event.substr(1)}`
        ] === 'function' &&
        this.poolStorage.on(event, connection =>
          this.options[
            `onConnection${event.charAt(0).toUpperCase() + event.substr(1)}`
          ](connection)
        )
    );
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
    return typeof callback === 'function' ? callback() : void 0;
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
        return this.startPool(() => {
          setTimeout(() => {
            return cb();
          }, this.options.preInitDelay);
        });
      }
    } else {
      // Close the connection pool
      return this.closePool(this.poolStorage, () =>
        this.startPool(() => {
          setTimeout(() => {
            this.checkPoolStatus(cb, scope);
          }, this.options.preInitDelay);
        })
      );
    }
  }

  // FUNCTION: Get connection from pool
  getConnection(cb, scope) {
    // Register query
    this.poolActivity[this.currentSessionId()]++;
    // Attempt to get connection
    return this.poolStorage.getConnection((err, con) => {
      // Check for errors getting the connection
      if (err) {
        if (this.options.errorLimit > scope.errorTracking) {
          // Track the failiure
          scope.errorTracking++;
          // Try getting another connection?
          if (err.code === 'POOL_CLOSED') {
            return this.startPool(() => {
              setTimeout(() => {
                this.getConnection(cb, scope);
              }, this.options.errorLimit);
            });
          } else if (err.code === 'POOL_ENQUEUELIMIT') {
            // Assign error message
            scope.errorMessage = {
              internalMsg: `Query limit reached, try increasing this value! MORE INFO: ${JSON.stringify(
                err,
                null,
                2
              )}`,
              err: err,
            };
            // Callback a null object
            return cb();
          } else {
            return setTimeout(() => {
              this.getConnection(cb, scope);
            }, this.options.errorLimit);
          }
        } else {
          // Assign error message
          scope.errorMessage = {
            internalMsg: `Initializing connection failed. MORE INFO: ${JSON.stringify(
              err,
              null,
              2
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
      return typeof scope.returnCallback === 'function'
        ? scope.returnCallback([], scope.errorMessage)
        : void 0;
    }
    // Start query execution..
    return scope.connection.query(scope.sqlCommand, (err, rows) => {
      // Register query
      this.poolActivity[this.currentSessionId()]++;
      // Check for any errors
      if (err) {
        // Assign sql commands
        err.sql = scope.sqlCommand;
        // Release connection
        scope.connection.release();
        // Destroy this connection as it has a failed query
        this.closeConnection(
          scope.connection,
          this.currentSessionId(),
          this.poolConnectionList
        );
        // Callback [ERROR]
        return typeof scope.returnCallback === 'function'
          ? scope.returnCallback([], err)
          : void 0;
      } else {
        // Release connection
        scope.connection.release();
        // Callback [SUCCESS]
        return typeof scope.returnCallback === 'function'
          ? scope.returnCallback(rows, err)
          : void 0;
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
        aysnc.series(
          [
            callback => this.checkPoolStatus(callback, scope),
            callback => this.getConnection(callback, scope),
            callback => this.execute(callback, scope),
          ],
          error => {
            if (error) {
              console.warn(
                `Unknown error in async series stack. MORE INFO: ${JSON.stringify(
                  error,
                  null,
                  2
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
module.exports = PoolManagerCore;
