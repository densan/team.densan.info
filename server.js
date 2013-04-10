/**
 * densan-core
 * server.js
 */

var express = require("express"),
    flash = require("connect-flash"),
    hogan = require("hogan-express"),
    passport = require("passport"),
    http = require("http"),
    path = require("path");

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

// router
require("./controllers")(app, passport);

http.createServer(app).listen(app.get("port"), function () {
  console.log("Express server running at " + app.get("port"));
});