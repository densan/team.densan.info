/**
 * Auth Controller
 */

var express = require("express");
var router = express.Router();
var passport = require("passport");
var googleStrategy = require("passport-google-oauth2").Strategy;
var config = require("config");
var validator = require("validator");
var libs = require("../libs");
var models = require("../models");

// startup token
var token = ~~(Math.random() * Math.pow(10, 8));

// initialize authenticate
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  models.User.getProfileList(id, done);
});

config.google.passReqToCallback = true;

passport.use(new googleStrategy(config.google, function (req, access_token, refresh_token, profile, done) {
  libs.logger.trace(profile);

  // user profile
  var user = {
    name: {
      first: profile.name.givenName,
      last:  profile.name.familyName
    },
    id: "---"
  };

  // check HUS Student
  var is_HUS_student = profile.emails.some(function (item) {
    var email = item.value;
    var is_HUS_email = validator.equals(email.slice(-9), "hus.ac.jp");
    if (is_HUS_email) {
      user.id = email.split("@")[0];
    }
    return is_HUS_email;
  });

  if (! is_HUS_student) {
    req.session.status = "ng";
    req.flash("error", {message: "HUS のメールアドレスで再度ログインしてください。　<a href='https://accounts.google.com/AddSession' target='_blank' data-toggle='tooltip' data-placement='bottom' title='このリンクから Google アカウントを追加し、再度ログインボタンを押してください。'>別のアカウントでログインするには</a>"});
    done(null, user);
  } else {
    // id exist check
    models.User.findOne({id: user.id}, function (err, user_profile) {
      if (err) {
        libs.logger.error(err);
      }

      if (user_profile === null) {
        req.session.status = "new";
        req.session.profile = user;
      }

      done(null, user);
    });
  }
}));

// check authenticate session
router.get("/", function (req, res, next) {
  req.flash("authenticate");
  req.flash("authenticate", token);
  next();
});

// auth callback
router.get("/callback", function (req, res, next) {
  if (req.flash("authenticate")[0] === token)
    return next();

  req.session.status = "ng";
  req.flash("error", {message: "予期せぬ認証エラー。再認証してください。"});
  res.redirect("/");
});

// google auth
router.get("/", passport.authenticate("google", {
  scope: ["openid", "email", "profile"]
}));
router.get("/callback", passport.authenticate("google", {
  successRedirect: "/",
  failureRedirect: "/auth/fail"
}));

// authentication failure
router.get("/fail", function (req, res) {
  libs.logger.error(req.flash("error"));
  req.flash("error", {message: "認証失敗"});
  res.redirect("/");
});

module.exports = router;
