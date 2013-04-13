/**
 * OAuth Controller
 */

var googleStrategy = require("passport-google").Strategy;

module.exports = function (app, passport, model) {
  // initialize authenticate
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (id, done) {
    done(null, id);
  });

  passport.use(new googleStrategy({
    returnURL: "http://localhost:3000/auth/callback",
    realm: "http://localhost:3000/",
    passReqToCallback: true
  }, function (req, id, profile, done) {
    // user profile
    var user = {
      status: "ok",
      name: {
        first: profile.name.givenName,
        last:  profile.name.familyName
      },
      email: null,
      team: [],
      role: 0,
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
      req.flash("error", {message: "HIT のメールアドレスで再度ログインしてください。"});
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
};