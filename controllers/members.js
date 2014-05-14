/**
 * Members Controller
 */

module.exports = function (context) {
  var app = context.app,
      router = context.router,
      model = context.model,
      Validator = context.Validator;

  router.all(2, "/members*", function (req, res, next) {
    model.Role.find(function (err, roles) {
      if (err) {
        console.error(err);
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

  router.get(2, "/members", function (req, res) {
    res.locals({
      root: res.locals,
      error: req.flash("error"),
      title: "Members",
      template: "members",
      members: [],
      team: "All"
    });

    model.User.getProfileList(function (err, users) {
      if (err) {
        console.error(err);
        return res.json(500, {
          message: "Database error.",
          e: err
        });
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

  router.get(2, "/members/:team", function (req, res) {
    res.locals({
      root: res.locals,
      error: req.flash("error"),
      title: req.params.team + " - Members",
      template: "members",
      members: [],
      team: req.params.team
    });

    model.Team.find(function (err, teams) {
      if (err) {
        console.error(err);
        return res.json(500, {
          message: "Database error.",
          e: err
        });
      }

      for (var i = 0, l = teams.length; i < l; i++)
        if (req.params.team === teams[i].name)
          break;

      if (i === l)
        return res.json(404, {error: "page not found"});

      model.User
        .find({team: teams[i]._id})
        .populate("team")
        .populate("role")
        .exec(function (err, users) {
          if (err) {
            console.error(err);
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
  router.post(2, "/members/:user_id", function (req, res) {
    if (! req.xhr)
      return res.send(400);

    // check permission
    if (! res.locals.admin)
      return res.json(401, {message: "Unauthorized"});

    model.User
      .findOne({id: req.params.user_id})
      .populate("team")
      .populate("role")
      .exec(function (err, user) {
        if (err) {
          console.error(err);
          return res.json(500, {
            message: "Database error.",
            e: err
          });
        }

        model.Role.findOne({name: req.body.role}, function (err, role) {
          if (err) {
            console.error(err);
            return res.json(500, {
              message: "Database error.",
              e: err
            });
          }

          user.role = role;

          user.save(function (err) {
            if (err) {
              console.error(err);
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
};