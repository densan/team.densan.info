/**
 * Top Controller
 */

var fs = require("fs"),
    path = require("path"),
    Flow = require("async-flow");

var ignoreList = [];
fs.readdir(path.join(__dirname, "../static"), function (err, files) {
  if (err)
    throw err;
  [].push.apply(ignoreList, files);
});

module.exports = function (context) {
  var app = context.app,
      router = context.router,
      model = context.model,
      Validator = context.Validator;

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
      if (req.user.status === "ng")
        req.logout();
      else {
        var redirect = req.flash("redirect");
        if (redirect.length > 0)
          return res.redirect(redirect[0]);

        if (req.user.status === "new") {
          // 新規登録画面
          res.locals.title = "New Account";
          res.locals.template = "new";
          res.locals.profile = req.user;
          model.Team.getNameList(function (err, teams) {
            if (err)
              console.log(err);

            res.locals.teams = teams;
            res.render(res.locals.template);
          });
          return false;
        } else {
          // ログイン後画面
          model.User.getProfileList(req.user.id, function (err, user_profiles) {
            if (err)
              console.log(err);

            console.log(user_profiles);

            if (user_profiles === null) {
              req.logout();
              return res.redirect("/");
            }

            model.Team.getNameList(function (err, teams) {
              if (err)
                console.log(err);

              // sync profile data
              res.locals.profile = req.user = user_profiles;

              res.locals.teams = teams;
              res.locals.title = "Home";
              res.locals.template = "home";
              res.render(res.locals.template);
            });
          });
          return false;
        }
      }
    }

    res.render(res.locals.template);
  });

  // check logged in
  router.get(1, "/:page*", function (req, res, next) {
    if (!~ ignoreList.indexOf(req.params.page))
      if (! req.user) {
        req.flash("redirect");
        req.flash("redirect", req.originalUrl);
        return res.redirect("/auth");
      } else {
        Flow.create(Flow.create().flow(function (done) {
          model.User.getProfileList(req.user.id, function (err, user_profiles) {
            if (err)
              console.log(err);

            if (user_profiles === null)
              return res.redirect("/");

            // sync profile data
            res.locals.profile = req.user = user_profiles;
            done();
          });
        }), Flow.create().flow(function (done) {
          model.Team.getNameList(function (err, teams) {
            if (err)
              console.log(err);

            // sync teams data
            res.locals.teams = teams;
            done();
          });
        })).flow(function () {
          next();
        });
        return false;
      }

    next();
  });
};