/**
 * Model Index
 */

var mongoose = require("mongoose"),
    autoloader = require("../libs/autoloader"),
    db = mongoose.connect("mongodb://localhost/densan");

module.exports = autoloader(__dirname, mongoose, db);