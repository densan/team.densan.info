/**
 * Contoroller Index
 */

var express = require("express");
var router = express.Router();
var libs = require("../libs");
var models = require("../models");
var mlo = require("mlo");

var routes = mlo(__dirname).load();

// middleware
router.use(function (req, res, next) {
  res.locals.admin = req.body && req.query.pass === process.env.MAINTENANCE_PASS || req.user && ~ req.user.role.permissions.indexOf("admin");
  res.locals.profile = req.user;
  res.locals.root = res.locals;
  models.Team.getNameList(function (err, teams) {
    if (err) {
      libs.logger.error(err);
    }

    res.locals.teams = teams || [];

    next();
  });
});

router.get("/", function (req, res) {
  res.locals.error = req.flash("error");
  res.locals.profile = null;
  res.locals.title = "Login";
  res.locals.template = "index";

  // check logged in
  if (req.user) {
    // 認証後リダイレクト
    var redirect = req.flash("redirect");
    if (redirect.length > 0) {
      return res.redirect(redirect[0]);
    }

    res.locals.profile = req.user;
    res.locals.title = "Home";
    res.locals.template = "home";
  } else if (req.session.status === "ng") {
    // auth failed
    req.logout();
    req.session.destroy && req.session.destroy();
    req.session = null;
  } else if (req.session.status === "new") {
    // registration page
    res.locals.title = "New Account";
    res.locals.template = "new";
    res.locals.profile = req.session.profile;
  }

  res.render(res.locals.template);
});

// logout
router.get("/logout", function (req, res) {
  req.logout();
  req.session.destroy && req.session.destroy();
  req.session = null;
  res.redirect("/");
});

// check logged in
router.get("/:page*", function (req, res, next) {
  if (! req.user && req.params.page !== "auth") {
    req.flash("redirect");
    req.flash("redirect", req.originalUrl);
    res.redirect("/auth");
    return false;
  }

  next();
});

Object.keys(routes).forEach(function (path) {
  router.use("/" + path, routes[path]);
});

module.exports = router;