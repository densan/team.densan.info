/**
 * User Model
 */

module.exports = function (mongoose, db, Validator) {
  var UserSchema = new mongoose.Schema({
    id: {
      type: String,
      index: {unique: true},
      required: true
    },
    name: {
      first: {
        type: String,
        required: true
      },
      last: {
        type: String,
        required: true
      }
    },
    email: {
      type: String,
      index: {unique: true},
      required: true,
      validate: [function (value) {
        if (! value)
          return false;

        var valid = new Validator();
        valid.check(value).isEmail();
        valid.check(value.slice(-10)).not(".hit.ac.jp");

        return valid.getErrors().length === 0;
      }, "不正なメールアドレスです"]
    },
    team: [{
      type: mongoose.Schema.ObjectId,
      ref: "Team",
      required: true
    }],
    role: {
      type: mongoose.Schema.ObjectId,
      ref: "Role",
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    }
  });

  UserSchema.statics.getProfileList = function (id, callback) {
    if (typeof id === "function")
      callback = id;

    var query = this.find();
    if (typeof id === "string")
      query = query.or([{id: id}]);
    else if (typeof id === "object")
      query = query.or(id.map(function (id) {
        return {id: id};
      }));

    query = query.populate("team").populate("role");
    query.exec(function (err, profiles) {
      if (err)
        return callback(err, []);

      profiles = profiles.map(function (profile) {
        profile = JSON.parse(JSON.stringify(profile));

        profile.team = profile.team.map(function (team) {
          return team.name;
        }).sort();
        profile.role = {
          name: profile.role.name,
          permission: profile.role.permission
        };

        return profile;
      });
      callback(err, profiles);
    });

    return query;
  };

  return mongoose.model("User", UserSchema);
};