/**
 * Model Index
 */

var mongoose = require("mongoose");

var db = mongoose.connect("mongodb://localhost/densan");

module.exports = {
  User: require("./user")(mongoose, db)
};