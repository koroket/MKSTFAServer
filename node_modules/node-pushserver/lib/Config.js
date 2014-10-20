/**
 * Created with JetBrains WebStorm.
 * User: smile
 * Date: 17/06/13
 * Time: 12:03
 * To change this template use File | Settings | File Templates.
 */
var _ = require('lodash');

var config;

var initialize = _.once(function (configFilePath, overrides) {
    return config = _.merge({}, require(configFilePath), overrides);
});

var get = function (key) {
    if (!config) initialize('../config.json');
    return config[key];
};

module.exports = {
    initialize: initialize,
    get: get
}