'use strict';

// Load Modules
const MySQL = require('mysql');

// Declare class
class PoolFunctions {
  // Initial constructor
  constructor() {
    // Assign module directly to instance
    this.raw = MySQL;

    // Bind Methods
    this.checkConnectionDetails = this.checkConnectionDetails.bind(this);
    this.checkPool = this.checkPool.bind(this);
    this.checkTimestamp = this.checkTimestamp.bind(this);
    this.closeIdleConnections = this.closeIdleConnections.bind(this);
    this.closePool = this.closePool.bind(this);
    this.createPool = this.createPool.bind(this);
    this.escapeValue = this.escapeValue.bind(this);
    this.getTimestamp = this.getTimestamp.bind(this);
  }

  // FUNCTION: Escape value
  escapeValue(value) {
    return MySQL.escape(value);
  }

  // FUNCTION: Create connection pool
  createPool(settings) {
    return MySQL.createPool(settings);
  }

  // FUNCTION: Check connection pool
  checkPool(pool) {
    return pool ? true : false;
  }

  // FUNCTION: Close Connection Pool
  closePool(pool, callback) {
    // Close all remaining connections..
    if (pool) {
      pool.end(err => {
        // Check for errors..
        err &&
          console.warn(
            `Failed to close pool / already closed. MORE INFO: ${err}`
          );
        // Set to undefined
        pool = undefined;
        // Callback
        if (typeof callback === 'function') {
          return callback();
        } else {
          return;
        }
      });
    }
  }

  // FUNCTION: Check if connection details are equal
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
    return (
      Object.keys(y).every(i => {
        return p.indexOf(i) !== -1;
      }) &&
      p.every(i => {
        return this.checkConnectionDetails(x[i], y[i]);
      })
    );
  }

  // FUNCTION: Get current timestamp
  getTimestamp() {
    return Math.floor(Date.now());
  }

  // FUNCTION: Check the timestamp has elapsed
  checkTimestamp(time, limit) {
    let currentTime = Math.floor(Date.now());
    return currentTime - time >= limit ? true : false;
  }

  // FUNCTION: Close idle connection pool
  closeIdleConnections(pool, list, reference) {
    // Check for idle connections and close them after time limit
    setTimeout(() => {
      if (!pool._closed) {
        // Check if any connections are free
        if (pool._freeConnections.length === 0) {
          // Reschedule check
          this.closeIdleConnections(pool, list, reference);
          // Return
          return;
        } else {
          // Check and close idle connections
          pool._freeConnections.forEach(element => {
            // Get current connection
            var freeConnection = element;
            // Check connection timestamp
            if (
              this.checkTimestamp(
                reference[list][freeConnection.threadId],
                this.options.maxConnextionTimeout
              )
            ) {
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
          if (reference[list].hasOwnProperty(connectRef)) {
            delete reference[list][connectRef];
          }
        }
        // Return
        return;
      }
    }, this.options.idleCheckInterval);
  }

  // FUNCTION: Check & close idle connection pools
  closeIdlePools(pool, activity, tracking, timeout) {
    // Capture current activity
    let currentActivity = tracking[activity];
    // Wait and then check if no activity has been registered
    setTimeout(() => {
      if (currentActivity === tracking[activity]) {
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
