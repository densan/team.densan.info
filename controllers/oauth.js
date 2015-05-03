/**
 * OAuth Controller
 */

var googleStrategy = require("passport-google").Strategy;
var libs = require("../libs");

module.exports = function (context) {
  var app = context.app,
      router = context.router,
      passport = context.passport,
      model = context.model;

  // initialize authenticate
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function (id, done) {
    model.User.getProfileList(id, done);
  });

  passport.use(new googleStrategy(app.get("auth"), function (req, id, profile, done) {
    // user profile
    var user = {
      name: {
        first: profile.name.givenName,
        last:  profile.name.familyName
      },
      id: "---"
    };

    // check HUS Student
    var is_HUS_student = profile.emails.some(function (item) {
      var email = item.value;
      var is_HUS_email = email.slice(-10) === ".hus.ac.jp";
      if (is_HUS_email) {
        user.id = email.split("@")[0];
      }
      return is_HUS_email;
    });

    if (! is_HUS_student) {
      req.session.status = "ng";
      req.flash("error", {message: "HUS のメールアドレスで再度ログインしてください。　<a href='https://accounts.google.com/AddSession' target='_blank' data-toggle='tooltip' data-placement='bottom' title='このリンクから Google アカウントを追加し、再度ログインボタンを押してください。'>別のアカウントでログインするには</a>"});
      done(null, user);
    } else {
      // id exist check
      model.User.findOne({id: user.id}, function (err, user_profile) {
        if (err) {
          libs.logger.error(err);
        }

        if (user_profile === null) {
          req.session.status = "new";
          req.session.profile = user;
        }

        done(null, user);
      });
    }
  }));

  // check authenticate session
  router.get(0, "/auth", function (req, res, next) {
    req.flash("authenticate");
    req.flash("authenticate", app.get("token"));
    next();
  });

  // auth callback
  router.get(0, "/auth/callback", function (req, res, next) {
    if (req.flash("authenticate")[0] === app.get("token"))
      return next();

    req.session.status = "ng";
    req.flash("error", {message: "予期せぬ認証エラー。再認証してください。"});
    res.redirect("/");
  });

  // google auth
  router.get(0, "/auth", passport.authenticate("google"));
  router.get(0, "/auth/callback", passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/auth/fail",
    failureFlash: true
  }));

  // authentication failure
  router.get(0, "/auth/fail", function (req, res) {
    libs.logger.error(req.flash("error"));
    req.flash("error", {message: "認証失敗"});
    res.redirect("/");
  });

  // logout
  router.get(0, "/logout", function (req, res) {
    req.logout();
    req.session.destroy && req.session.destroy();
    req.session = null;
    res.redirect("/");
  });
};
