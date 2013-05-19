/**
 * Members Controller
 */

module.exports = function (context) {
  var app = context.app,
      router = context.router,
      model = context.model,
      Validator = context.Validator;

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
          role: user.role
        };
      });
      res.locals.members = users;
      res.render(res.locals.template);
    });
  });

  router.get(2, "/members/:team", function (req, res) {
    res.locals({
      root: res.locals,
      error: req.flash("error"),
      title: "Members",
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
              }).sort(),
              role: {
                name: user.role.name,
                permission: user.role.permission
              }
            };
          });
          res.render(res.locals.template);
        });
    });
  });
};