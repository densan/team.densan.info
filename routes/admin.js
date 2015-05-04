/**
 * New Controller
 */

var express = require("express");
var router = express.Router();
var hogan = require("hogan.js");
var libs = require("../libs");
var models = require("../models");
var path = require("path");
var fs = require("fs");

// maintenance mode
router.use("/", function (req, res, next) {
  // check permission
  if (! res.locals.admin) {
    return res.json(401, {message: "Unauthorized"});
  }

  next();
});

router.get("/", function (req, res) {
  res.locals.error = req.flash("error");
  res.locals.title = "Admin";
  res.locals.template = "admin";

  res.render(res.locals.template);
});

router.get("/role", function (req, res) {
  res.locals.error = req.flash("error");
  res.locals.title = "Role - Admin";
  res.locals.template = "admin/role";

  models.Role.getWithNop(function (err, roles) {
    if (err) {
      libs.logger.error(err);
      return res.json(500, {
        message: "Database error.",
        e: err
      });
    }

    res.locals.roles = JSON.stringify(roles);
    res.render(res.locals.template);
  });
});

router.post("/role", function (req, res) {
  // check XHR
  if (! req.xhr) {
    return res.json(400, {message: "Bad Request"});
  }

  // check logged in
  if (! req.user) {
    return res.json(401, {message: "Unauthorized"});
  }

  if (req.body.roles.length < 1) {
    return res.json(400, {message: "Roles must have least one role."});
  }

  models.Role.getWithNop({
    name: {"$ne": "default"}
  }, function (err, c_roles) {
    if (err) {
      libs.logger.error(err);
      return res.json(500, {
        message: "Database error.",
        e: err
      });
    }

    var roles = {},
        n_roles = [];
    req.body.roles.forEach(function (role) {
      if (role._id) {
        // array -> hash
        roles[role._id] = role;
      } else {
        // filter new roles
        n_roles.push(role);
      }
    });

    var del_roles = [];
    c_roles = c_roles.map(function (c_role) {
      if (roles[c_role._id]) {
        return roles[c_role._id];
      } else if (c_role.nop === 0) {
        // check number of people
        del_roles.push({
          _id: c_role._id
        });
        return false;
      } else {
        return false;
      }
    }).filter(function (e) {
      return e;
    });

    var promises = [];
    // insert
    if (n_roles.length > 0) {
      promises.push(models.Role.create(n_roles));
    }
    // update
    if (c_roles) {
      [].push.apply(promises, c_roles.map(function (role) {
        return models.Role.update({_id: role._id}, role).exec();
      }));
    }
    // delete
    if (del_roles.length > 0) {
      promises.push(models.Role.find().or(del_roles).exec("remove"));
    }

    promises.reduce(function (p1, p2) {
      return p1.then(function (roles) {
        return p2;
      });
    }).then(function () {
      // find all
      return models.Role.getWithNop();
    }).then(function (roles) {
      res.json({
        status: "ok",
        roles: roles
      });
    }).reject(function (err) {
      libs.logger.error(err);
      res.json(500, {
        message: "Database error.",
        e: err
      });
    });
  });
});

router.get("/team", function (req, res) {
  res.locals.error = req.flash("error");
  res.locals.title = "Team - Admin";
  res.locals.template = "admin/team";

  models.Team.getWithNop().then(function (teams) {
    res.locals.data = JSON.stringify(teams);
    res.render(res.locals.template);
  }).reject(function (err) {
    libs.logger.error(err);
    res.json(500, {
      message: "Database error.",
      e: err
    });
  });
});

router.get("/userlist.txt", function (req, res) {
  res.locals.error = req.flash("error");
  res.locals.title = "userlist";
  res.locals.template = "adminGetUserList.txt";

  // get user list
  models.User.getProfileList(function (err, users) {
    if (err) {
      libs.logger.error(err);
      return res.json(500, {
        message: "Database error.",
        e: err
      });
    }

    libs.logger.trace("\033[31mAdminAccess: \033[32m%s\033[m", req.user.id);

    res.locals.members = users;
    res.set({
      "Content-Type": "text/csv"
    });

    fs.readFile(path.join(path.resolve(__dirname, "../views"), res.locals.template), "utf8", function (err, data) {
      if (err) {
        libs.logger.error(err);
        return res.json(500, {
          message: "Database error.",
          e: err
        });
      }

      var userlist = hogan.compile(data).render({members: users});
      res.send(userlist);
    });
  });
});

module.exports = router;
