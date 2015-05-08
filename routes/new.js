/**
 * New Controller
 */

var express = require("express");
var router = express.Router();
var models = require("../models");

router.post("/", function (req, res) {
  // check XHR
  if (! req.xhr) {
    return res.status(400).json({
      status: "ng",
      message: "Bad Request"
    });
  }

  // check logged in
  if (! req.session.profile) {
    return res.status(401).json({message: "Unauthorized"});
  }
  if (req.session.status !== "new") {
    return res.status(403).json({message: "Forbidden"});
  }

  var user = JSON.parse(JSON.stringify(req.session.profile));
  user.email = req.body.email;
  user.team = req.body.team || [];

  // check team property
  if (! Array.isArray(user.team) || user.team.length === 0) {
    return res.status(400).json({
      status: "ng",
      message: "Error",
      errors: ["チームを一つ以上選択してください"]
    });
  }

  var queries = user.team.map(function (team) {
    return {name: team};
  });

  new Promise(function (resolve, reject) {
    models.Team.find()
    .or(queries)
    .exec().then(resolve, reject);
  }).then(function (teams) {
    user.team = teams;

    return models.Role.findOne({name: "member"})
    .exec();
  }).then(function (role) {
    user.role = role;

    return models.User.create(user);
  }).then(function (user) {
    req.session.status = null;
    req.session.passport.user = user.id;

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
