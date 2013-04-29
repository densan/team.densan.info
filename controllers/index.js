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

  model = model(url, Validator);

  var routes = [],
      router = {
        get: proxy.bind(app, "get"),
        post: proxy.bind(app, "post"),
        put: proxy.bind(app, "put"),
        head: proxy.bind(app, "head"),
        "delete": proxy.bind(app, "delete"),
        options: proxy.bind(app, "options"),
        trace: proxy.bind(app, "trace")
      };

  function proxy(method, priority, path, ctrl) {
    if (! (method in router))
      throw Error("method must be one of the following (get, post, put, head, delete, options, trace).");
    if (typeof priority !== "number")
      throw TypeError("priority must be number");
    if (typeof path !== "string")
      throw TypeError("path must be string");
    if (typeof ctrl !== "function")
      throw TypeError("ctrl must be function");

    routes.push({
      primary: priority,
      secondary: routes.length,
      ctrl: app[method].bind(app, path, ctrl)
    });
  }

  var module = autoloader(__dirname, {
    app: app,
    router: router,
    passport: passport,
    model: model,
    Validator: Validator
  });

  routes.sort(function (a, b) {
    var d = a.primary - b.primary;
    return d === 0 ? a.secondary - b.secondary : d;
  }).forEach(function (route) {
    route.ctrl();
  });

  return module;
};