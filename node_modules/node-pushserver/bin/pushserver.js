#!/usr/bin/env node
/**
 * Created with JetBrains WebStorm.
 * User: smile
 * Date: 14/06/13
 * Time: 15:45
 * To change this template use File | Settings | File Templates.
 */

var config = require('../lib/Config'),
    web = require('../lib/Web'),
    pack = require('../package'),
    program = require('commander'),
    fs = require('fs'),
    path = require('path');

program.version(pack.version)
    .option("-c --config <configPath>", "Path to config file")
    .parse(process.argv);

var configPath = program.config;
if (configPath) {
    configPath = configPath.indexOf('/') === 0 ? configPath : path.join(process.cwd(), configPath);
    if (!fs.existsSync(configPath)) {
        console.log('The configuration file doesn\'t exist.');
        return program.outputHelp();
    }
} else {
    console.log('You must provide a configuration file.');
    return program.outputHelp();
}

config.initialize(configPath);
web.start();