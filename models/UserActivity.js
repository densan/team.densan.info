/**
 * UserActivity Model
 */

var mongoose = require("mongoose");

var UserActivity = new mongoose.Schema({
  id: {
    type: String,
    index: true,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  detail: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    "default": Date.now,
    required: true
  },
  rowData: {
    type: String
  }
});

UserActivity.statics.checkActivity = function (id, url, callback) {
  this.find({id: id, url: url});
  callback(new Error("is not implemented"));
};

module.exports = mongoose.model("UserActivity", UserActivity);
