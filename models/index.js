/**
 * Model Index
 */

var mongoose = require("mongoose");
var config = require("config");
var mlo = require("mlo");
var url = require("url");

var libs = require("../libs");

var models = mlo(__dirname).load();

var options = {
  protocol: "mongodb",
  slashes: true,
  port: config.db.port,
  hostname: config.db.host,
  pathname: config.db.name
};

if (config.db.user && config.db.pass) {
  options.auth = [config.db.user, config.db.pass].join(":");
}

var mongo_url = url.format(options);
var mng = mongoose.connect(mongo_url);
mng.connections[0].on("connected", function () {
  // initialize Team Data
  models.Team.find(function (err, teams) {
    if (err) {
      libs.logger.error(err);
    }

    libs.logger.trace(teams);

    if (teams.length === 0) {
      ["CG", "DTM", "Hard", "Network", "Soft"].forEach(function (name) {
        var team = new models.Team({
          name: name
        });
        team.save(function (err) {
          if (err)
            libs.logger.error(err);
        });
      });
    }
  });

  // initialize Role Data
  models.Role.find(function (err, roles) {
    if (err) {
      libs.logger.error(err);
    }

    libs.logger.trace(roles);

    if (roles.length === 0) {
      var role = new models.Role({
        name: "member"
      });
      role.save(function (err) {
        if (err)
          libs.logger.error(err);
      });
    }
  });
});

module.exports = models;
