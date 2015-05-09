/**
 * File Model
 */

var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
  id: {
    type: String,
    index: {unique: true},
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    "default": Date.now
  }
});

module.exports = mongoose.model("File", UserSchema);
