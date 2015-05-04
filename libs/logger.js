/**
 * logger.js
 *
 */

var log4js = require("log4js");
var log4js_extend = require("log4js-extend");
var config = require("config");
var path = require("path");

log4js_extend(log4js, {
  path: path.dirname(__dirname)
});

log4js.configure(config.logger);

module.exports = log4js.getLogger();
