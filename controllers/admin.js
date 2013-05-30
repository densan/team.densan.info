/**
 * New Controller
 */

var hogan = require("hogan.js"),
    path = require("path"),
    fs = require("fs");

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
      template: "admin"
    });

    // check permission
    if (!~ [].indexOf.call(req.user.role, "control-panel"))
      return res.json(400, {message: "Bad Request"});

    res.render(res.locals.template);
  });

  router.get(2, "/admin/:pass/userlist.txt", function (req, res) {
    res.locals({
      root: res.locals,
      error: req.flash("error"),
      title: "Role - Admin",
      template: "adminGetUserList.txt"
    });

    if (req.params.pass !== process.env.MAINTENANCE_PASS)
      return res.json(400, {message: "Bad Request"});

    // get user list
    model.User.getProfileList(function (err, users) {
      if (err)
        console.log(err);

      console.log("\033[31mAdminAccess: \033[32m%s\033[m", req.user.id);

      res.locals.members = users;
      res.set({
        "Content-Type": "text/csv"
      });

      fs.readFile(path.join(app.get("views"), res.locals.template), "utf8", function (err, data) {
        if (err)
          throw err;
        var userlist = hogan.compile(data).render({members: users});
        res.send(userlist);
      });
    });
  });
};