/**
 * Top Controller
 */

var fs = require("fs"),
    path = require("path");

var ignoreList = [];
fs.readdir(path.join(__dirname, "../static"), function (err, files) {
  if (err)
    throw err;
  [].push.apply(ignoreList, files);
});

module.exports = function (context) {
  var app = context.app,
      router = context.router,
      model = context.model;

  router.get(1, "/", function (req, res) {
    res.locals({
      root: res.locals,
      error: req.flash("error"),
      profile: null,
      title: "Login",
      template: "index",
      teams: []
    });

    // check logged in
    if (req.user) {
      // 認証後リダイレクト
      var redirect = req.flash("redirect");
      if (redirect.length > 0)
        return res.redirect(redirect[0]);

      res.locals.profile = req.user;
      res.locals.title = "Home";
      res.locals.template = "home";

      model.Team.getNameList(function (err, teams) {
        if (err)
          console.log(err);

        res.locals.teams = teams;
        res.render(res.locals.template);
      });

      return false;
    }

    if (req.session.status === "ng") {
      // auth failed
      req.logout();
      req.session.destroy && req.session.destroy();
      req.session = null;
    } else if (req.session.status === "new") {
      // registration page
      res.locals.title = "New Account";
      res.locals.template = "new";
      res.locals.profile = req.session.profile;
      model.Team.getNameList(function (err, teams) {
        if (err)
          console.log(err);

        res.locals.teams = teams;
        res.render(res.locals.template);
      });

      return false;
    }

    res.render(res.locals.template);
  });

  // check logged in
  router.get(1, "/:page*", function (req, res, next) {
    if (!~ ignoreList.indexOf(req.params.page)) {
      if (! req.user) {
        req.flash("redirect");
        req.flash("redirect", req.originalUrl);
        res.redirect("/auth");
      } else {
        res.locals.profile = req.user;

        model.Team.getNameList(function (err, teams) {
          if (err)
            console.log(err);

          // sync teams data
          res.locals.teams = teams;
          next();
        });
      }
    } else {
      next();
    }
  });
};