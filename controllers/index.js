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

  var routes = [];
  var router = {
    all: proxy.bind(app, "all"),
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
      throw new Error("method must be one of the following (all, get, post, put, head, delete, options, trace).");
    if (typeof priority !== "number")
      throw new TypeError("priority must be number");
    if (typeof path !== "string")
      throw new TypeError("path must be string");
    if (typeof ctrl !== "function")
      throw new TypeError("ctrl must be function");

    routes.push({
      primary: priority,
      secondary: routes.length,
      ctrl: app[method].bind(app, path, ctrl)
    });
  }

  // maintenance ctrl
  router.all(0, "/*", function (req, res, next) {
    res.locals.admin = req.body && req.query.pass === process.env.MAINTENANCE_PASS || ~ req.user.role.permissions.indexOf("admin");
    next();
  });

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