/**
 * New Controller
 */

var express = require("express");
var router = express.Router();
var libs = require("../libs");
var models = require("../models");

router.post("/", function (req, res) {
  // check XHR
  if (! req.xhr) {
    return res.json(400, {message: "Bad Request"});
  }

  // check logged in
  if (! req.session.profile)
    return res.json(401, {message: "Unauthorized"});
  if (req.session.status !== "new")
    return res.json(403, {message: "Forbidden"});

  var user = JSON.parse(JSON.stringify(req.session.profile));
  user.email = req.body.email;
  user.team = req.body.team || [];

  // check team property
  if (typeof user.team === "string")
    user.team = [req.body.team];
  if (user.team.length === 0)
    return res.json(400, {message: "Error", errors: ["チームを一つ以上選択してください"]});

  models.Team.getNameList(function (err, teams) {
    if (err) {
      libs.logger.error(err);
    }

    res.locals.teams = teams;

    models.Role.findOne({name: "member"}, function (err, role) {
      if (err) {
        libs.logger.error(err);
      }

      user.role = role;

      var queries = user.team.map(function (team) {
        return {name: team};
      });

      models.Team.find()
      .or(queries)
      .exec(function (err, team) {
        if (err) {
          libs.logger.error(err);
        }

        user.team = team;

        user = new models.User(user);
        user.save(function (err) {
          if (err) {
            var errors = [];
            if (err.errors) {
              errors = Object.keys(err.errors).map(function (key) {
                return key + ":" + err.errors[key].message;
              });
            } else if (err.err) {
              errors.push("次の情報を管理者へお伝え下さい", "DB Error: " + err.err);
            } else {
              errors.push("次の情報を管理者へお伝え下さい", "DB Error: Unknown");
            }

            res.json(400, {message: "Error", errors: errors});
            return libs.logger.error(err);
          }

          req.session.status = null;
          req.session.passport.user = user.id;

          res.json({status: "ok"});
        });
      });
    });
  });
});

module.exports = router;
