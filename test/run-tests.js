'use strict';

/* This is the core file for running tests in the daemon programmically... */

// Modules
var MC = require('mocha');
var FS = require('graceful-fs');
var PT = require('path');

// Base Test Configuration File
var MochaInstanceAll = new MC();
var DirectoryAll = ['./mocha/'];

// Get all mocha test files
DirectoryAll.forEach(function(element, index, array) {
  FS.readdirSync(element).filter(function(file) {
    return file.substr(-3) === '.js';
  }).forEach(function(file) {
    MochaInstanceAll.addFile(
      PT.join(element, file)
    );
  });
})

// FUNCTION: Run all tests
function RUN_ALL() {
  MochaInstanceAll.run(function(failures) {
    process.on('exit', function() {
      process.exit(failures);
    });
  });
}

RUN_ALL();
