/**
 * Profile Controller
 */

module.exports = function (context) {
  var app = context.app,
      router = context.router,
      model = context.model,
      Validator = context.Validator;

  router.get(2, "/profile", function (req, res) {
    res.locals({
      root: res.locals,
      error: req.flash("error"),
      profile: null,
      title: "Profile",
      template: "profile",
      teams: [],
      index: function () {
        return res.locals.profile.team.indexOf(this.valueOf());
      }
    });

    model.Team.getNameList(function (err, teams) {
      if (err)
        console.log(err);

      res.locals.teams = teams;

      model.User.getProfileList(req.user.id, function (err, user_profiles) {
        if (err)
          console.log(err);

        res.locals.profile = user_profiles[0];
        res.render(res.locals.template);
      });
    });
  });

  router.post(2, "/profile/save", function (req, res) {
    // check XHR
    if (! req.xhr)
      return res.json(400, {message: "Bad Request"});

    // check logged in
    if (! req.user)
      return res.json(401, {message: "Unauthorized"});

    req.user.team = [];
    Object.keys(req.body).map(function (key) {
      if (key.slice(0, 4) === "team")
        req.user.team.push(req.body[key]);
    });
    var queries = req.user.team.map(function (team) {
      return {name: team};
    });

    model.Team
      .find()
      .or(queries)
      .exec(function (err, team) {
        if (err)
          console.log(err);

      req.user.team = team;
      req.user.email = req.body.email;
      req.user.timestamp = Date.now();
      model.User.findOne({id: req.user.id}, function (err, user_profile) {
        if (err)
          console.log(err);

        user_profile.set("team", req.user.team);
        user_profile.set("email", req.user.email);
        user_profile.set("timestamp", req.user.timestamp);
        user_profile.save(function (err) {
          if (err) {
            var errs = [];
            for (var error in err.errors)
              errs.push(err.errors[error].type);

            res.json(400, {message: "Error", errors: errs});
            return console.log(err);
          }

          req.user.status = "ok";

          res.json({message: "OK"});
        });
      });
    });
  });
};