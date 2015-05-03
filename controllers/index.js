/**
 * Contoroller Index
 */

var models = require("../models");
var autoloader = require("../libs/autoloader");

module.exports = function (app, passport) {
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
    res.locals.admin = req.body && req.query.pass === process.env.MAINTENANCE_PASS || req.user && ~ req.user.role.permissions.indexOf("admin");
    next();
  });

  var module = autoloader(__dirname, {
    app: app,
    router: router,
    passport: passport,
    model: models
  });

  routes.sort(function (a, b) {
    var d = a.primary - b.primary;
    return d === 0 ? a.secondary - b.secondary : d;
  }).forEach(function (route) {
    route.ctrl();
  });

  return module;
};