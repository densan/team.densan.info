/**
 * file manager
 *
 */

var mmm = require("mmmagic");
var mime = require("mime");
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

var magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);

// directory cleanup
exports.cleanup = function (dir) {
  return new Promise(function (resolve, reject) {
    fs.readdir(dir, function (err, files) {
      if (err) {
        return reject(err);
      }

      resolve(files);
    });
  }).then(function (files) {
    var promises = files.filter(function (filename) {
      return filename[0] !== ".";
    }).map(function (filename) {
      return new Promise(function (resolve, reject) {
        var filepath = path.join(dir, filename);
        fs.unlink(filepath, function (err) {
          if (err) {
            return reject(err);
          }

          resolve(filepath);
        });
      });
    });

    return Promise.all(promises);
  });
};

exports.generateId = function () {
  return new Promise(function (resolve, reject) {
    crypto.randomBytes(6 * 3, function (err, buff) {
      if (err) {
        return reject(err);
      }

      // 24 characters
      var key = buff.toString("base64").split("/").join("-");
      // 13 characters
      var timestamp = Date.now().toString();

      // id: 38 characters
      resolve(key + "_" + timestamp);
    });
  });
};

exports.save = function (files, upload_dir) {
  var promises = files.map(function (file) {
    var promise = new Promise(function (resolve, reject) {
      magic.detectFile(file.path, function (err, type) {
        if (err) {
          return reject(err);
        }

        resolve(type);
      });
    });

    return Promise.all([exports.generateId(), promise]);
  });

  var dirname = files[0].user.id;

  return Promise.all(promises).then(function (results) {
    return new Promise(function (resolve, reject) {
      fs.mkdir(path.join(upload_dir, dirname), 0755, function (err) {
        if (err && err.code !== "EEXIST") {
          return reject(err);
        }

        resolve(results);
      });
    });
  }).then(function (results) {
    var promises = files.map(function (file, index) {
      var result = results[index];

      file.id = result[0];
      file.type = result[1];
      file.filepath = path.join(dirname, file.id + "." + mime.extension(file.type));

      return new Promise(function (resolve, reject) {
        fs.rename(file.path, path.join(upload_dir, file.filepath), function (err) {
          if (err) {
            return reject(err);
          }

          resolve(file);
        });
      });
    });

    return Promise.all(promises);
  });
};

exports.remove = function (files, upload_dir) {
  var promises = files.map(function (file) {
    return new Promise(function (resolve, reject) {
      fs.unlink(path.join(upload_dir, file.path), function (err) {
        if (err) {
          return reject(err);
        }

        resolve(file);
      });
    });
  });

  return Promise.all(promises);
};
