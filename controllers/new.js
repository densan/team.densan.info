/**
 * New Controller
 */

module.exports = function (context) {
  var app = context.app,
      router = context.router,
      model = context.model,
      Validator = context.Validator;

  router.post(2, "/new", function (req, res) {
    // check XHR
    if (! req.xhr)
      return res.json(400, {message: "Bad Request"});

    // check logged in
    if (! req.session.profile)
      return res.json(401, {message: "Unauthorized"});
    if (req.session.status !== "new")
      return res.json(403, {message: "Forbidden"});

    var user = JSON.parse(JSON.stringify(req.session.profile));
    user.email = req.body.email;
    user.team = req.body.team || [];

    // check team property
    if (typeof user.team === "string")
      user.team = [req.body.team];
    if (user.team.length === 0)
      return res.json(400, {message: "Error", errors: ["チームを一つ以上選択してください"]});

    model.Team.getNameList(function (err, teams) {
      if (err)
        console.log(err);

      res.locals.teams = teams;

      model.Role.findOne({name: "member"}, function (err, role) {
        if (err)
          console.log(err);

        user.role = role;

        var queries = user.team.map(function (team) {
          return {name: team};
        });

        model.Team
          .find()
          .or(queries)
          .exec(function (err, team) {
            if (err)
              console.log(err);

            user.team = team;

            user = new model.User(user);
            user.save(function (err) {
              if (err) {
                var errs = [];
                if (err.errors) {
                  for (var error in err.errors)
                    if (err.errors.hasOwnProperty(error))
                      errs.push(err.errors[error].type);
                } else if (err.err)
                  errs.push("次の情報を管理者へお伝え下さい", "DB Error: " + err.err);
                else
                  errs.push("次の情報を管理者へお伝え下さい", "DB Error: Unknown");

                res.json(400, {message: "Error", errors: errs});
                return console.log(err);
              }

              req.session.status = null;
              req.session.passport.user = user.id;

              res.json({message: "OK"});
            });
          });
      });
    });
  });
};