/**
 * User Model
 */

module.exports = function (mongoose, db) {
  mongoose.model("User", new mongoose.Schema({
    id: {
      type: String,
      unique: true,
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
      required: true
    },
    team: [{
      type: mongoose.Schema.ObjectId,
      ref: "Team"
    }],
    role: {
      type: mongoose.Schema.ObjectId,
      ref: "Role"
    },
    timestamp: {
      type: Date,
      required: true
    }
  }));

  return db.model("User");
};