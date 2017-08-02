# MySQL Connection Pool Manager

This is a production level Node.JS API wrapper which allows for intelligent management &amp; load balancing mySQL connection pools. Its designed to be used by persistent and self-terminating processes.  

For example, most connection pools keep connections open for the duration of the process, and relies on the mySQL server terminating the process. With this module you can manage the connection count and release unused mySQL connections amongst other things.  

# Install

To install run the following command in the terminal:

    npm install mysql-connection-pool-manager --save

# Features

This module is designed to be highly flexible with exported internal functions which you can utilise to create your own custom scripts or change the behaviour of the module. The module supports instancing so you can create as many as you want.

# Configuration

Below is a list of configuration options which you must pass when initialising an instance:



# Basic Usage

Below is an example of the basic usage of the module:

## Simple Insertion Script

Example 1

## Switching Servers

Example 2

## Contributing

All contributions are welcome, please read my [CONTRIBUTING.md](https://github.com/daviemakz/mysql-connection-pool-manager/blob/master/CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/daviemakz/mysql-connection-pool-manager/pulls) or as [GitHub issues](https://github.com/daviemakz/mysql-connection-pool-manager/issues). If you'd like to improve code, please feel free!
