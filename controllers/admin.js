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
      title: "Admin",
      template: "admin",
      members: []
    });

    // check permission
    if (req.user.role)
      console.log(req.user.role.permission);

    res.render(res.locals.template);
  });
};