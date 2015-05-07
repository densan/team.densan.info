/**
 * Profile Controller
 */

var express = require("express");
var router = express.Router();
var libs = require("../libs");
var models = require("../models");

router.get("/", function (req, res) {
  res.locals.error = req.flash("error");
  res.locals.title = "Profile";
  res.locals.template = "profile";
  res.locals.index = function () {
    return res.locals.profile.team.indexOf(this.valueOf());
  };

  res.render(res.locals.template);
});

router.post("/", function (req, res) {
  // check XHR
  if (! req.xhr) {
    return res.status(400).json({
      status: "ng",
      message: "Bad Request"
    });
  }

  // get team list and validate
  var team = req.body.team || [];
  if (! Array.isArray(team) || team.length === 0) {
    return res.status(400).json({
      status: "ng",
      message: "Error",
      errors: ["チームを一つ以上選択してください"]
    });
  }

  var queries = team.map(function (team) {
    return {name: team};
  });

  new Promise(function (resolve, reject) {
    models.Team.find()
    .or(queries)
    .exec().then(resolve, reject);
  }).then(function (teams) {
    return models.User.update({
      id: req.user.id
    }, {
      email: req.body.email,
      team: teams
    }).exec();
  }).then(function () {
    return models.User.findOne({
      id: req.user.id
    }).populate("team");
  }).then(function (user) {
    res.json({
      status: "ok",
      user: user
    });
  }).catch(function (err) {
    res.status(500).json({
      status: "ng",
      errors: [err.message]
    });
  });
});

module.exports = router;
