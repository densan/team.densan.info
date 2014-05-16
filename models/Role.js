/**
 * Role Model
 */

module.exports = function (mongoose, db) {
  var schema = new mongoose.Schema({
    name: {
      type: String,
      index: {unique: true},
      required: true
    },
    permissions: {
      type: [String],
      required: true,
      "default": ["login"]
    }
  });

  schema.static("getWithNop", function (callback) {
    var promise = new mongoose.Promise;
    if (callback) promise.addBack(callback);

    var User = mongoose.model("User");

    this.find().exec().then(function (roles) {
      var nops = [];

      roles.map(function (role) {
        return User.find({role: role}).exec();
      }).reduce(function (p1, p2) {
        return p1.then(function (users) {
          nops.push(users.length);
          return p2;
        });
      }).then(function (users) {
        nops.push(users.length);

        roles = roles.map(function (role) {
          role = role.toObject();
          // number of people
          role.nop = nops.shift();
          return role;
        });

        promise.resolve(null, roles);
      });
    }).reject(promise.resolve.bind(promise));

    return promise;
  });

  return mongoose.model("Role", schema);
};
