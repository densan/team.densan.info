/**
 * Team Model
 */

module.exports = function (mongoose, db) {
  mongoose.model("Team", new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    leader: {
      type: mongoose.Schema.ObjectId,
      ref: "User"
    }
  }));

  return db.model("Team");
};