/**
 * OAuth Controller
 */

var googleStrategy = require("passport-google").Strategy;

module.exports = function (context) {
  var app = context.app,
      router = context.router,
      passport = context.passport,
      model = context.model;

  // initialize authenticate
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (id, done) {
    done(null, id);
  });

  passport.use(new googleStrategy(app.get("auth"), function (req, id, profile, done) {
    // user profile
    var user = {
      status: "ok",
      name: {
        first: profile.name.givenName,
        last:  profile.name.familyName
      },
      email: null,
      team: [],
      role: null,
      id: null
    };

    // check HIT Student
    var is_HIT_student = profile.emails.some(function (item) {
      var email = item.value;
      var is_HIT_email = email.slice(-18) === "@stumail.hit.ac.jp";
      if (is_HIT_email)
        user.id = email.slice(0, -18);
      return is_HIT_email;
    });

    if (! is_HIT_student) {
      user.status = "ng";
      req.flash("error", {message: "HIT のメールアドレスで再度ログインしてください。　<a href='https://accounts.google.com/AddSession' target='_blank' data-toggle='tooltip' data-placement='bottom' title='このリンクから Google アカウントを追加し、再度ログインボタンを押してください。'>別のアカウントでログインするには</a>"});
      done(null, user);
    } else {
      // id exist check
      model.User.findOne({id: user.id}, function (err, user_profile) {
        if (err)
          console.log(err);

        if (user_profile === null)
          user.status = "new";

        done(null, user);
      });
    }
  }));

  // check authenticate session
  var token = ~~(Math.random() * Math.pow(10, 8));
  router.get(0, "/auth", function (req, res, next) {
    req.flash("authenticate");
    req.flash("authenticate", token);
    next();
  });
  router.get(0, "/auth/callback", function (req, res, next) {
    if (req.flash("authenticate")[0] === token)
      return next();

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
    console.log(req.flash("error"));
    req.flash("error", {message: "認証失敗"});
    res.redirect("/");
  });

  // logout
  router.get(0, "/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });
};