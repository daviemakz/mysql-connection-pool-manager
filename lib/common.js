'use strict';

// Load NPM modules
const mySQL = require('mysql');

// Declare class
class PoolManagerFunctionsCommon {
  // Initial constructor
  constructor() {
    // Assign module directly to instance
    this.raw = mySQL;
    // Bind methods
    return [
      'checkConnectionDetails',
      'checkPool',
      'checkTimestamp',
      'closeIdleConnections',
      'closeConnection',
      'closePool',
      'createPool',
      'escapeValue',
      'getTimestamp',
    ].forEach(func => (this[func] = this[func].bind(this)));
  }

  // FUNCTION: Escape value
  escapeValue(value) {
    return mySQL.escape(value);
  }

  // FUNCTION: Create connection pool
  createPool(settings) {
    return mySQL.createPool(settings);
  }

  // FUNCTION: Check connection pool
  checkPool(pool) {
    return pool ? true : false;
  }

  // FUNCTION: Close Connection Pool
  closePool(pool, callback) {
    // Close all remaining connections..
    return (
      pool &&
      pool.end(err => {
        // Check for errors..
        err &&
          console.warn(
            `Failed to close pool / already closed. MORE INFO: ${err}`
          );
        // Set to undefined
        pool = undefined;
        // Return callback
        return typeof callback === 'function' ? callback() : void 0;
      })
    );
  }

  // FUNCTION: Check if connection details are equal
  checkConnectionDetails(x, y) {
    // Initial quick check
    if (x === null || x === undefined || y === null || y === undefined) {
      return x === y;
    }
    // After this just checking type of one would be enough
    if (x.constructor !== y.constructor) {
      return false;
    }
    // If they are functions, they should exactly refer to same one (because of closures)
    if (x instanceof Function) {
      return x === y;
    }
    // If they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
    if (x instanceof RegExp) {
      return x === y;
    }
    if (x === y || x.valueOf() === y.valueOf()) {
      return true;
    }
    if (Array.isArray(x) && x.length !== y.length) {
      return false;
    }
    // If they are dates, they must had equal valueOf
    if (x instanceof Date) {
      return false;
    }
    // If they are strictly equal, they both need to be object at least
    if (!(x instanceof Object)) {
      return false;
    }
    if (!(y instanceof Object)) {
      return false;
    }
    // Recursive object equality check
    var p = Object.keys(x);
    // Return
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
    return Math.floor(Date.now()) - time >= limit ? true : false;
  }

  // FUNCTION: Close connection
  closeConnection(connection, list, reference) {
    // Remove connection from list
    delete reference[list][connection.threadId];
    // Close the connection
    return typeof connection.destroy === 'function' && connection.destroy();
  }

  // FUNCTION: Close idle connection pool
  closeIdleConnections(pool, list, reference) {
    // Check for idle connections and close them after time limit
    return setTimeout(() => {
      if (!pool._closed) {
        // Check if any connections are free
        if (pool._freeConnections.length === 0) {
          // Reschedule check
          return this.closeIdleConnections(pool, list, reference);
        } else {
          // Check and close idle connections
          pool._freeConnections.forEach(freeConnection => {
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
              return freeConnection.destroy();
            }
          });
          // Reschedule check
          return this.closeIdleConnections(pool, list, reference);
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
    return setTimeout(
      () =>
        currentActivity === tracking[activity]
          ? this.closePool(pool)
          : this.closeIdlePools(pool, activity, tracking, timeout),
      timeout
    );
  }
}

// EXPORTS
module.exports = PoolManagerFunctionsCommon;
