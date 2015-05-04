/**
 * Members Controller
 */

var express = require("express");
var router = express.Router();
var libs = require("../libs");
var models = require("../models");

router.use("/", function (req, res, next) {
  models.Role.find(function (err, roles) {
    if (err) {
      libs.logger.error(err);
      return res.json(500, {
        message: "Database error.",
        e: err
      });
    }

    res.locals.roles = roles.map(function (role) {
      return role.name;
    });

    next();
  });
});

router.get("/", function (req, res) {
  res.locals.error = req.flash("error");
  res.locals.title = "Members";
  res.locals.template = "members";
  res.locals.members = [];
  res.locals.team = "All";

  models.User.getProfileList(function (err, users) {
    if (err) {
      libs.logger.error(err);
      return res.json(500, {
        message: "Database error.",
        e: err
      });
    }

    // API for Ajax
    if (req.xhr) {
      return res.json(users);
    }

    res.locals.members = users.map(function (user) {
      var data = {
        id: user.id,
        name: user.name,
        team: user.team,
        role: user.role.name,
        selected: function () {
          return String(this) === user.role.name;
        }
      };

      // check email permission
      if (~ req.user.role.permissions.indexOf("email")) {
        data.email = user.email;
      }

      return data;
    });

    res.render(res.locals.template);
  });
});

router.get("/:team", function (req, res) {
  res.locals.error = req.flash("error");
  res.locals.title = req.params.team + " - Members";
  res.locals.template = "members";
  res.locals.members = [];
  res.locals.team = req.params.team;

  models.Team.find(function (err, teams) {
    if (err) {
      libs.logger.error(err);
      return res.json(500, {
        message: "Database error.",
        e: err
      });
    }

    for (var i = 0, l = teams.length; i < l; i++) {
      if (req.params.team === teams[i].name) {
        break;
      }
    }

    if (i === l) {
      return res.json(404, {error: "page not found"});
    }

    models.User.find({team: teams[i]._id})
    .populate("team")
    .populate("role")
    .exec(function (err, users) {
      if (err) {
        libs.logger.error(err);
        return res.json(500, {
          message: "Database error.",
          e: err
        });
      }

      res.locals.members = users.map(function (user) {
        var data = {
          id: user.id,
          name: user.name,
          team: user.team.map(function (team) {
            return team.name;
          }),
          role: user.role.name,
          selected: function () {
            return String(this) === user.role.name;
          }
        };

        // check email permission
        if (~ req.user.role.permissions.indexOf("email")) {
          data.email = user.email;
        }

        return data;
      });

      res.render(res.locals.template);
    });
  });
});

// update member role
router.post("/:user_id", function (req, res) {
  if (! req.xhr) {
    return res.send(400);
  }

  // check permission
  if (! res.locals.admin) {
    return res.json(401, {message: "Unauthorized"});
  }

  models.User.findOne({id: req.params.user_id})
  .populate("team")
  .populate("role")
  .exec(function (err, user) {
    if (err) {
      libs.logger.error(err);
      return res.json(500, {
        message: "Database error.",
        e: err
      });
    }

    models.Role.findOne({name: req.body.role}, function (err, role) {
      if (err) {
        libs.logger.error(err);
        return res.json(500, {
          message: "Database error.",
          e: err
        });
      }

      user.role = role;

      user.save(function (err) {
        if (err) {
          libs.logger.error(err);
          return res.json(500, {
            message: "Database error.",
            e: err
          });
        }

        res.json({
          status: "ok"
        });
      });
    });
  });
});

module.exports = router;
