/**
 * densan-core
 * server.js
 */

var express = require("express"),
    flash = require("connect-flash"),
    hogan = require("hogan-express"),
    passport = require("passport"),
    yaml = require("js-yaml"),
    http = require("http"),
    path = require("path"),
    fs = require("fs");

// load settings
var config = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, "config.yml"), "utf8"));

// express server settings
var app = express();

app.configure("development", "maintenance-dev", function () {
  app.use(express.logger("dev"));
  app.use(express.errorHandler());
});

app.configure(function () {
  app.set("port", 3000);
  app.set("mongo", {
    hostname: config.db.host,
    port: config.db.port,
    username: config.db.user,
    password: config.db.pass,
    db: config.db.name
  });
  app.set("auth", {
    returnURL: "http://localhost:3000/auth/callback",
    realm: "http://localhost:3000/",
    passReqToCallback: true
  });
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
      var current_title = this.title.split("-").slice(-1)[0].trim();
      return title === current_title ? "active" : "";
    }
  });
  app.set("views", path.join(__dirname, "views"));
  // startup token
  app.set("token", ~~(Math.random() * Math.pow(10, 8)));
  app.engine("html", hogan);
  app.use(express.static(path.join(__dirname, "static")));
  app.use(express.cookieParser("secaccerss:c"));
  app.use(express.bodyParser());
  app.use(express.cookieSession({
    secret: "exkeyprepass",
    // expire after 1 week
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}
  }));
  app.use(flash());
  app.use(express.csrf());
  app.use(function (req, res, next) {
    // set csrf token
    res.locals.csrf_token = req.session._csrf;
    next();
  });
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

app.configure("production", "maintenance-pro", function () {
  if (process.env.VCAP_APP_PORT)
    app.set("port", process.env.VCAP_APP_PORT);
  else
    app.set("port", 61030);

  if (process.env.VCAP_SERVICES) {
    var services = JSON.parse(process.env.VCAP_SERVICES);
    if (services["mongodb-1.8"][0].credentials)
      app.set("mongo", services["mongodb-1.8"][0].credentials);

    app.set("auth", {
      returnURL: "http://densan.hp.af.cm/auth/callback",
      realm: "http://densan.hp.af.cm",
      passReqToCallback: true
    });
  } else {
    app.set("auth", {
      returnURL: "http://team.densan.info/auth/callback",
      realm: "http://team.densan.info",
      passReqToCallback: true
    });
  }

  app.enable("view cache");
  app.use(express.compress());
  process.on("uncaughtException", function (err) {
    console.log(err);
  });
});

// router
require("./controllers")(app, passport);

http.createServer(app).listen(app.get("port"), function () {
  console.log("Express server running at " + app.get("port"));
});
