/**
 * Contoroller Index
 */

var validator = require("validator"),
    model = require("../models"),
    autoloader = require("../libs/autoloader"),
    Validator = validator.Validator;

// Validator settings
Validator.prototype.error = function (msg) {
  this._errors.push(msg);
  return this;
};
Validator.prototype.getErrors = function () {
  return this._errors;
};

module.exports = function (app, passport) {
  var mongo = app.get("mongo"),
      url = "mongodb://";

  if (mongo.username && mongo.password)
    url += mongo.username + ":" + mongo.password + "@";
  url += mongo.hostname + ":" + mongo.port + "/" + mongo.db;

  model = model(url);

  return autoloader(__dirname, {
    app: app,
    passport: passport,
    model: model,
    Validator: Validator
  });
};