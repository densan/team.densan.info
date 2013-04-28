/**
 * New Controller
 */

module.exports = function (context) {
  var app = context.app,
      router = context.router,
      model = context.model,
      Validator = context.Validator;

  router.get(2, "/admin", function (req, res) {
    res.locals({
      root: res.locals,
      error: req.flash("error"),
      profile: null,
      title: "Admin",
      template: "admin",
      teams: [],
      members: []
    });

    // check permission
    if (req.user.role)
      console.log(req.user.role.permission);

    model.Team.getNameList(function (err, teams) {
      if (err)
        console.log(err);

      res.locals.teams = teams;
      res.render(res.locals.template);
    });
  });
};