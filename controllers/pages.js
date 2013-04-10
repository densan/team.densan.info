/**
 * Pages Controller
 */

// あとで DB に移す
var teams = ["CG", "Network", "Soft"];

module.exports = function (app, Validator, model) {
  app.get("/", function (req, res) {
    res.locals({
      root: res.locals,
      error: req.flash("error"),
      profile: null,
      title: "Login",
      template: "index",
      teams: teams
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
          res.locals.title = "New Account";
          res.locals.template = "new";
          res.locals.profile = req.user;
        } else {
          model.User.findOne({id: req.user.id}, function (err, user_profile) {
            err && console.log(err);
            
            if (user_profile === null) {
              req.logout();
              return res.redirect("/");
            }
            
            res.locals.profile = user_profile;
            res.locals.title = "Home";
            res.locals.template = "home";
            res.render(res.locals.template);
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
        model.User.findOne({id: req.user.id}, function (err, user_profile) {
          err && console.log(err);
          
          if (user_profile === null)
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
      teams: teams,
      members: []
    });
    
    model.User.find({}, function (err, users) {
      err && console.log(err);
      
      res.locals.members = users;
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
    
    var user = new User(req.user);
    user.save(function (err) {
      if (err)
        console.log(err);
    });
    
    res.json({message: "OK"});
  });
  
  // logout
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });
};