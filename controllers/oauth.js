/**
 * OAuth Controller
 */

var googleStrategy = require("passport-google").Strategy;

module.exports = function (context) {
  var app = context.app,
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

  // google auth
  app.get("/auth", passport.authenticate("google"));
  app.get("/auth/callback", passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/",
    failureFlash: true
  }));

  // logout
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });
};