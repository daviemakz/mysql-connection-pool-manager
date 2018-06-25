'use strict';

// Load NPM modules
const autoBind = require('auto-bind');

// Load library modules
const PoolCore = require('./lib/pool');

// Build instance
class MySQLPoolManagerInstance extends PoolCore {
  // Initial constructor
  constructor(options) {
    // Allow access to 'this'
    super() && autoBind(this);
    // Check configuration
    return this.config(options);
  }

  // Function: Assign settings
  config(options) {
    // Define required properties
    const props = [
      'idlePoolTimeout',
      'errorLimit',
      'preInitDelay',
      'sessionTimeout',
      'maxConnextionTimeout',
      'idleCheckInterval',
    ];
    // Validation configuration
    props.forEach(prop => {
      if (!options.hasOwnProperty(prop)) {
        throw new Error(`The required property ${prop} is not defined!`);
      }
      if (typeof options[prop] !== 'number' && props.includes(prop)) {
        throw new Error(`The property ${prop} is not a number!`);
      }
    });
    // Check mysql settings are defined
    if (typeof options.mySQLSettings !== 'object') {
      throw new Error(`MySQL settings are not defined or not an object!`);
    }
    // Spread options to this
    return (this.options = Object.assign({}, options)) && this;
  }
}

// Exports
module.exports = options => new MySQLPoolManagerInstance(options);
