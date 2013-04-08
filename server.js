/**
 * densan-core
 * server.js
 */

// あとで DB に移す
var teams = ["CG", "Network", "Soft"];

var express = require("express"),
    flash = require("connect-flash"),
    hogan = require("hogan-express"),
    passport = require("passport"),
    googleStrategy = require("passport-google").Strategy,
    validator = require("validator"),
    mongoose = require("mongoose"),
    http = require("http"),
    path = require("path");

// db settings
mongoose.model("User", new mongoose.Schema({
  name: {
    first: String,
    last : String
  },
  email: String,
  team : Array,
  role : Number,
  id   : Number
}));
var db = mongoose.connect("mongodb://localhost/densan"),
    User = db.model("User");

// express server settings
var app = express();
app.configure(function () {
  app.set("view engine", "html");
  app.set("layout", "layout");
  app.set("partials", {
    error  : "partials/error",
    head   : "partials/head",
    menu   : "partials/menu",
    footer : "partials/footer"
  });
  app.locals({
    menu: function (title) {
      var active = title === this.title ? "active" : "";
      return active;
    }
  });
  app.set("views", path.join(__dirname, "views"));
  app.engine("html", hogan);
  app.use(express.cookieParser("secaccerss:c"));
  app.use(express.bodyParser());
  app.use(express.cookieSession({
    secret: "exkeyprepass",
    cookie: {maxAge: 60000 * 24 * 7}
  }));
  app.use(flash());
  app.use(express.csrf());
  app.use(function (req, res, next) {
    res.locals.csrf_token = req.session._csrf;
    next();
  });
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, "static")));
});

app.configure("development", function () {
  app.set("port", 3000);
  app.use(express.favicon());
  app.use(express.logger("dev"));
  app.use(express.errorHandler());
});

app.configure("production", function () {
  app.set("port", 3000);
  app.enable("view cache");
  app.use(express.compress());
  process.on("uncaughtException", function (err) {
    console.log(err);
  });
});

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
    User.findOne({id: user.id}, function (err, user_profile) {
      console.log(user_profile);
      
      err && console.log(err);
      
      if (user_profile === null)
        user.status = "new";
      
      done(null, user);
    });
  }
}));

// Validator
Validator = validator.Validator;
Validator.prototype.error = function (msg) {
  this._errors.push(msg);
  return this;
};
Validator.prototype.getErrors = function () {
  return this._errors;
};

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
      } else {
        User.findOne({id: req.user.id}, function (err, user_profile) {
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
      User.findOne({id: req.user.id}, function (err, user_profile) {
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
  
  User.find({}, function (err, users) {
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

http.createServer(app).listen(app.get("port"), function () {
  console.log("Express server running at " + app.get("port"));
});