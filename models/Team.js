/**
 * Team Model
 */

module.exports = function (mongoose, db) {
  var schema = new mongoose.Schema({
    name: {
      type: String,
      index: {unique: true},
      required: true
    },
    leader: {
      type: mongoose.Schema.ObjectId,
      ref: "User"
    }
  });

  schema.static("getNameList", function (callback) {
    var query = this.find("name").sort({name: 1});
    query.exec(function (err, teams) {
      if (err)
        return callback(err, []);

      teams = teams.map(function (team) {
        return team.name;
      });
      callback(err, teams);
    });
    return query;
  });

  schema.static("getWithNop", function (conditions, callback) {
    if (typeof conditions === "function") {
      callback = conditions;
      conditions = null;
    }

    conditions = conditions || {};

    var promise = new mongoose.Promise;
    if (callback) promise.addBack(callback);

    var User = mongoose.model("User");

    this.find(conditions).exec().then(function (teams) {
      var nops = [];

      return teams.map(function (team) {
        return User.find({team: team}).exec();
      }).reduce(function (p1, p2) {
        return p1.then(function (users) {
          nops.push(users.length);
          return p2;
        });
      }).then(function (users) {
        nops.push(users.length);

        teams = teams.map(function (team) {
          team = team.toObject();
          // number of people
          team.nop = nops.shift();
          return team;
        });

        promise.resolve(null, teams);
      });
    }).reject(promise.resolve.bind(promise));

    return promise;
  });

  return mongoose.model("Team", schema);
};
