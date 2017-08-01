'use strict';

// MySQL Common Functions - Contains common functions used across the mySQL connection models.

// Load Modules
var SQ = require('mysql');
var UT = require('util');

// Declare class
class PoolFunctions {

  // Initial constructor
  constructor() {

    // Bind Methods
    this.closeIdleConnections = this.closeIdleConnections.bind(this);
    this.escapeValue = this.escapeValue.bind(this);
    this.createPool = this.createPool.bind(this);
    this.checkPool = this.checkPool.bind(this);
    this.closePool = this.closePool.bind(this);
    this.checkConnectionDetails = this.checkConnectionDetails.bind(this);
    this.emitQueryError = this.emitQueryError.bind(this);
    this.getTimestamp = this.getTimestamp.bind(this);
    this.checkTimestamp = this.checkTimestamp.bind(this);

  }

  // FUNCTION: Escape Value
  escapeValue(value) {
    return SQ.escape(value);
  }

  // FUNCTION: Create Connection Pool
  createPool(settings) {
    return SQ.createPool(settings);
  }

  // FUNCTION: Check Connection Pool
  checkPool(pool) {
    return pool ? true : false;
  }

  // FUNCTION: Close Connection Pool
  closePool(pool, callback) {
    // Close all remaining connections..
    if (pool) {
      pool.end(function(err) {
        // Check for errors..
        err && console.warn(`Failed to close pool / already closed. MORE INFO: ${err}`);
        // Set to undefined
        pool = undefined;
        // Callback
        if (typeof(callback) == "function") {
          callback();
        } else {
          return;
        }
      });
    }
  }

  // FUNCTION: Check If Connection Details Are Equal
  checkConnectionDetails(x, y) {
    if (x === null || x === undefined || y === null || y === undefined) {
      return x === y;
    }
    // after this just checking type of one would be enough
    if (x.constructor !== y.constructor) {
      return false;
    }
    // if they are functions, they should exactly refer to same one (because of closures)
    if (x instanceof Function) {
      return x === y;
    }
    // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
    if (x instanceof RegExp) {
      return x === y;
    }
    if (x === y || x.valueOf() === y.valueOf()) {
      return true;
    }
    if (Array.isArray(x) && x.length !== y.length) {
      return false;
    }
    // if they are dates, they must had equal valueOf
    if (x instanceof Date) {
      return false;
    }
    // if they are strictly equal, they both need to be object at least
    if (!(x instanceof Object)) {
      return false;
    }
    if (!(y instanceof Object)) {
      return false;
    }
    // recursive object equality check
    var p = Object.keys(x);
    return Object.keys(y).every(function(i) {
      return p.indexOf(i) !== -1;
    })
    && p.every(function(i) {
      return checkConnectionDetails(x[i], y[i]);
    });
  }

  // FUNCTION: MySQL Query Emit Warning
  emitQueryError(error) {
    if (typeof process !== 'undefined' && typeof process.emitWarning !== 'undefined') {
      process.emitWarning(UT.inspect(error, false, null), 'unhandledRejection');
    } else {
      console.warn(UT.inspect(error, false, null));
    }
  }

  // FUNCTION: Get Current Timestamp
  getTimestamp() {
    return Math.floor(Date.now());
  }

  // FUNCTION: Check The Timestamp Has Elapsed
  checkTimestamp(time, limit) {
    let currentTime = Math.floor(Date.now());
    return ((currentTime - time) >= limit) ? true : false;
  }

  // FUNCTION: Close Idle Conection Pool
  closeIdleConnections(pool, list, reference) {
    // Check for idle connections and close them after time limit
    setTimeout(function() {
      if (!(pool._closed)) {
        // Check if any connections are free
        if (pool._freeConnections.length == 0) {
          // Reschedule check
          this.closeIdleConnections(pool, list, reference);
          // Return
          return;
        } else {
          // Check and close idle connections
          pool._freeConnections.forEach(function(element, index
            , array) {
            // Get current connection
            var freeConnection = element;
            // Check connection timestamp
            if (this.checkTimestamp(reference[list][freeConnection.threadId]
                , this.options.maxConnextionTimeout)) {
              // Remove connection from list
              delete reference[list][freeConnection.threadId];
              // Close the connection
              freeConnection.destroy();
              // Return
              return;
            }
          });
          // Reschedule check
          this.closeIdleConnections(pool, list, reference);
          // Return
          return;
        }
      } else {
        // Remove all connections from tracking object of closed pool
        for (var connectRef in reference[list]) {
          delete reference[list][connectRef];
        }
        // Return
        return;
      }
    }, this.options.idleCheckInterval);
  }

  // FUNCTION: Check & Close Idle Connection Pools
  closeIdlePools(pool, activity, tracking, timeout) {
    // Capture current activity
    let currentActivity = tracking[activity];
    // Wait and then check if no activity has been registered
    setTimeout(function() {
      if (currentActivity == tracking[activity]) {
        // Close the connection pool
        this.closePool(pool);
        // Return
        return;
      } else {
        // Restart the check function (indefinitely)
        this.closeIdlePools(pool, activity, tracking, timeout);
        // Return
        return;
      }
    }, timeout);
  }

}

// EXPORTS
module.exports = PoolFunctions;
