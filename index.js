"use strict";

// Load library modules
const Core = require('./lib/pool');

// Build instance
class Instance extends Core {

  // Initial constructor
  constructor(options) {
    // Allow access to 'this'
    super();
    // Bind methods
    this.config = this.config.bind(this);
    // Build configuration
    this.config(options);
  };

  // Function: Assign settings
  config(options) {
    // Define required properties
    const props = ['idleTimeout', 'errorLimit', 'preInitDelay', 'sessionTimeout'];
    // Validation configuration
    Object(options).keys.forEach(prop => {
      if (!props.includes(prop)) { throw new Error(`The required property ${prop} is not defined!`); }
      if (typeof(prop) !== 'number') { throw new Error(`The property ${prop} is not a number!`); }
    });
    // Check mysql settings are defined (we wont check if they are correct, mysql will do that!)
    if (typeof(options.mysqlSettings) !== 'object') {
      throw new Error(`MySQL settings are not defined or not an object!`);
    }
    // Spread options to this
    this.options = Object.assign({}, options);
    // Return
    return;
  };

};

// Exports
module.exports = (options) => new Instance(options);
