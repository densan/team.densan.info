/**
 * User Model
 */

module.exports = function (mongoose, db) {
  mongoose.model("User", new mongoose.Schema({
    name: {
      first: String,
      last : String
    },
    email: String,
    team : Array,
    role : Number,
    id   : Number
  }));
  
  return User = db.model("User");
};