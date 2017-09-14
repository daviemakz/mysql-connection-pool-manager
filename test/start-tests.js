'use strict';

/* This is the core file for running tests in the daemon programmically... */

// Modules
const MC = require('mocha');
const FS = require('graceful-fs');
const PT = require('path');

// Base Test Configuration File
const MochaInstanceAll = new MC();
const DirectoryAll = ['./mocha/'];

// Get all mocha test files
DirectoryAll.forEach(function(element) {
  FS.readdirSync(element)
    .filter(function(file) {
      return file.substr(-3) === '.js';
    })
    .forEach(function(file) {
      MochaInstanceAll.addFile(PT.join(element, file));
    });
});

// FUNCTION: Run all tests
function RUN_ALL() {
  MochaInstanceAll.run(function(failures) {
    process.on('exit', function() {
      process.exit(failures);
    });
  });
}

// Run tests...
RUN_ALL();
