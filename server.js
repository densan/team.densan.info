/**
 * densan-core
 * server.js
 */

var express = require("express");
var bodyParser = require("body-parser");
var session = require("express-session");
var MongoStore = require("connect-mongo")(session);
var flash = require("connect-flash");
var csrf = require("csurf");
var hogan = require("hogan-express");
var passport = require("passport");
var config = require("config");
var libs = require("./libs");
var routes = require("./routes");
var path = require("path");

// express server settings
var app = express();

// express settings
app.disable("x-powered-by");
app.set("port", process.env.PORT || config.server.port);
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "html");
app.set("layout", "layout");
app.engine("html", hogan);
app.set("partials", {
  error  : "partials/error",
  head   : "partials/head",
  menu   : "partials/menu",
  footer : "partials/footer"
});
app.locals.menu = function () {
  return function (title) {
    var current_title = this.title.split("-").slice(-1)[0].trim();
    return title === current_title ? "active" : "";
  };
};

// middleware
app.use(express.static(path.resolve(__dirname, "static")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  name: config.session.name,
  cookie: config.session.cookie,
  secret: config.session.secret,
  store: new MongoStore({
    db: config.db.name,
    host: config.db.host,
    port: config.db.port,
    username: config.db.user,
    password: config.db.pass
  }),
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use(csrf());
app.use(function (req, res, next) {
  // set csrf token
  res.locals.csrf_token = req.csrfToken();
  next();
});

// passport settings
app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});

app.use(routes);

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: err
    });
    next; // ignore jshint error
  });
} else {
  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: null
    });
    next; // ignore jshint error
  });
}

process.on("uncaughtException", function (err) {
  libs.logger.error(err);
});

var server = app.listen(config.server.port, function() {
  console.log("Express server listening on", JSON.stringify(server.address()));
});
