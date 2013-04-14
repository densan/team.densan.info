/**
 * Pages Controller
 */

module.exports = function (context) {
  var app = context.app,
      model = context.model,
      Validator = context.Validator;

  app.get("/", function (req, res) {
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

            if (user_profiles.length === 0) {
              req.logout();
              return res.redirect("/");
            }

            model.Team.getNameList(function (err, teams) {
              if (err)
                console.log(err);

              res.locals.profile = user_profiles[0];

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
  app.get("/:page", function (req, res, next) {
    if (!~ ["auth", "logout"].indexOf(req.params.page))
      if (! req.user) {
        req.flash("redirect", req.params.page);
        return res.redirect("/auth");
      } else {
        model.User.getProfileList(req.user.id, function (err, user_profiles) {
          if (err)
            console.log(err);

          if (user_profiles.length === 0)
            return res.redirect("/");

          next();
        });
        return false;
      }

    next();
  });

  app.get("/members", function (req, res) {
    res.locals({
      root: res.locals,
      error: req.flash("error"),
      profile: null,
      title: "Members",
      template: "members",
      teams: [],
      members: []
    });

    model.User.getProfileList(function (err, users) {
      if (err)
        console.log(err);

      res.locals.members = users;

      model.Team.getNameList(function (err, teams) {
        if (err)
          console.log(err);

        res.locals.teams = teams;
        res.render(res.locals.template);
      });
    });
  });

  app.get("/admin", function (req, res) {
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

  app.post("/new", function (req, res) {
    // check XHR
    if (! req.xhr)
      return res.json(400, {message: "Bad Request"});

    // check logged in
    if (! req.user)
      return res.json(401, {message: "Unauthorized"});
    if (req.user.status !== "new")
      return res.json(403, {message: "Forbidden"});

    model.Team.getNameList(function (err, teams) {
      if (err)
        console.log(err);

      res.locals.teams = teams;

      // validation
      var valid = new Validator();
      valid.check(req.body.team).isIn(teams);
      valid.check(req.body.email).isEmail();
      valid.check(req.body.email.slice(-18)).not("@stumail.hit.ac.jp");

      var errors = valid.getErrors();
      if (errors.length > 0)
        return res.json(400, {message: "Validation Error", errors: errors});

      req.user.status = "ok";
      req.user.team.push(req.body.team);
      req.user.email = req.body.email;
      req.user.timestamp = Date.now();

      model.Role.findOne({name: "member"}, function (err, role) {
        if (err)
          console.log(err);

        req.user.role = role;

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

            var user = new model.User(req.user);
            user.save(function (err) {
              if (err) {
                res.json({message: "Error", errors: [err]});
                return console.log(err);
              }
              res.json({message: "OK"});
            });
          });
      });
    });
  });
};