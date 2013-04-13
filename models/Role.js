/**
 * Role Model
 */

module.exports = function (mongoose, db) {
  mongoose.model("Role", new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    permission: {
      type: Array,
      required: true
    }
  }));

  return db.model("Role");
};