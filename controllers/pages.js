/**
 * Pages Controller
 */

var fs = require("fs"),
    path = require("path");

var ignoreList = ["auth", "logout"];
fs.readdir(path.join(__dirname, "../static"), function (err, files) {
  if (err)
    throw err;
  [].push.apply(ignoreList, files);
});

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
  app.get("/:page*", function (req, res, next) {
    if (!~ ignoreList.indexOf(req.params.page))
      if (! req.user) {
        req.flash("redirect");
        req.flash("redirect", req.originalUrl);
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
      members: [],
      team: "All"
    });

    model.User.getProfileList(function (err, users) {
      if (err)
        console.log(err);

      users = users.map(function (user) {
        return {
          name: user.name,
          team: user.team,
          role: user.role
        };
      });
      res.locals.members = users;

      model.Team.getNameList(function (err, teams) {
        if (err)
          console.log(err);

        res.locals.teams = teams;
        res.render(res.locals.template);
      });
    });
  });
  app.get("/members/:team", function (req, res) {
    res.locals({
      root: res.locals,
      error: req.flash("error"),
      profile: null,
      title: "Members",
      template: "members",
      teams: [],
      members: [],
      team: req.params.team
    });

    model.Team.find(function (err, teams) {
      if (err)
        console.log(err);

      for (var i = 0, l = teams.length; i < l; i++)
        if (req.params.team === teams[i].name)
          break;

      if (i === l)
        return res.json(404, {error: "page not found"});

      res.locals.teams = teams.map(function (teams) {
        return teams.name;
      }).sort();

      model.User
        .find({team: teams[i]._id})
        .populate("team")
        .populate("role")
        .exec(function (err, users) {
          if (err)
            console.log(err);

          res.locals.members = users.map(function (user) {
            return {
              name: user.name,
              team: user.team.map(function (team) {
                return team.name;
              }).sort(),
              role: {
                name: user.role.name,
                permission: user.role.permission
              }
            };
          });
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

      model.Role.findOne({name: "member"}, function (err, role) {
        if (err)
          console.log(err);

        req.user.role = role;

        req.user.team = [];
        var team = req.body.team0;
        for (var i = 0; team; team = req.body["team" + (++i)])
          req.user.team[i] = team;

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

            var user = new model.User(req.user);
            user.save(function (err) {
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
  });
};