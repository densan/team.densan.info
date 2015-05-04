/**
 * Profile Controller
 */

var express = require("express");
var router = express.Router();
var libs = require("../libs");
var models = require("../models");

router.get("/", function (req, res) {
  res.locals.error = req.flash("error");
  res.locals.profile = req.user;
  res.locals.title = "Profile";
  res.locals.template = "profile";
  res.locals.index = function () {
    return res.locals.profile.team.indexOf(this.valueOf());
  };

  res.render(res.locals.template);
});

router.post("/save", function (req, res) {
  // check XHR
  if (! req.xhr) {
    return res.json(400, {message: "Bad Request"});
  }

  // check logged in
  if (! req.user) {
    return res.json(401, {message: "Unauthorized"});
  }

  // get user list
  req.user.team = req.body.team ? req.body.team : [];
  if (typeof req.user.team === "string") {
    req.user.team = [req.body.team];
  }
  // check team list
  if (req.user.team.length === 0) {
    return res.json(400, {message: "Error", errors: ["チームを一つ以上選択してください"]});
  }

  var queries = req.user.team.map(function (team) {
    return {name: team};
  });

  models.Team.find()
  .or(queries)
  .exec(function (err, team) {
    if (err) {
      libs.logger.error(err);
    }

    req.user.team = team;
    req.user.email = req.body.email;
    req.user.timestamp = Date.now();
    models.User.findOne({id: req.user.id}, function (err, user_profile) {
      if (err) {
        libs.logger.error(err);
      }

      user_profile.set("team", req.user.team);
      user_profile.set("email", req.user.email);
      user_profile.set("timestamp", req.user.timestamp);
      user_profile.save(function (err) {
        if (err) {
          var errors = Object.keys(err.errors).map(function (key) {
            return key + ":" + err.errors[key].message;
          });

          res.json(400, {message: "Error", errors: errors});
          return libs.logger.error(err);
        }

        req.user.status = "ok";

        res.json({status: "ok"});
      });
    });
  });
});

module.exports = router;
