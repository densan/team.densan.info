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
      if (err)
        console.error(err);

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
      if (err)
        console.log(err);

      users = users.map(function (user) {
        return {
          name: user.name,
          team: user.team,
          role: user.role.name,
          selected: function () {
            return String(this) === user.role.name;
          }
        };
      });
      res.locals.members = users;
      res.render(res.locals.template);
    });
  });

  router.post(2, "/members/:user_id", function (req, res) {
    if (! req.xhr)
      return res.send(400);

    console.log("chenge user data - not implemented");

    res.send(200);
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
      if (err)
        console.log(err);

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
          if (err)
            console.log(err);

          res.locals.members = users.map(function (user) {
            return {
              name: user.name,
              team: user.team.map(function (team) {
                return team.name;
              }),
              role: user.role.name,
              selected: function () {
                return String(this) === user.role.name;
              }
            };
          });

          res.render(res.locals.template);
        });
    });
  });
};