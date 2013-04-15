/**
 * Model Index
 */

var mongoose = require("mongoose"),
    autoloader = require("../libs/autoloader");

module.exports = function (url) {
  var db = mongoose.connect(url),
      model = autoloader(__dirname, mongoose, db);

  // initialize Team Data
  model.Team.find(function (err, teams) {
    if (err)
      console.error(err);

    console.log(teams);

    if (teams.length === 0) {
      ["CG", "DTM", "Hard", "Network", "Soft"].forEach(function (name) {
        var team = new model.Team({
          name: name
        });
        team.save(function (err) {
          if (err)
            console.error(err);
        });
      });
    }
  });

  // initialize Role Data
  model.Role.find(function (err, roles) {
    if (err)
      console.error(err);

    console.log(roles);

    if (roles.length === 0) {
      var role = new model.Role({
        name: "member"
      });
      role.save(function (err) {
        if (err)
          console.error(err);
      });
    }
  });

  return model;
};