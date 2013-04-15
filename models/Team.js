/**
 * Team Model
 */

module.exports = function (mongoose, db) {
  var TeamSchema = new mongoose.Schema({
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

  TeamSchema.statics.getNameList = function (callback) {
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
  };

  return mongoose.model("Team", TeamSchema);
};