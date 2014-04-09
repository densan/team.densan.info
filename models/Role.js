/**
 * Role Model
 */

module.exports = function (mongoose, db) {
  var RoleSchema = new mongoose.Schema({
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

  return mongoose.model("Role", RoleSchema);
};
