/**
 * Uploader
 *
 */

var express = require("express");
var router = express.Router();
var multer = require("multer");
var libs = require("../libs");
var models = require("../models");
var path = require("path");

// upload directory
const temp_dir = path.resolve(__dirname, "../temp");
const upload_dir = path.resolve(__dirname, "../static/upload");

libs.file.cleanup(temp_dir).then(function () {
  libs.logger.info("cleaned temp dir");
});

router.get("/", function (req, res) {
  res.locals.error = req.flash("error");
  res.locals.title = "Uploader";
  res.locals.template = "upload";

  return res.render(res.locals.template);
});

router.get("/files.json", function (req, res) {
  new Promise(function (resolve, reject) {
    models.File.find()
    .populate("user")
    .exec().then(resolve, reject);
  }).then(function (files) {
    res.json({
      status: "ok",
      files: files
    });
  }).catch(function (err) {
    res.status(500).json({
      status: "ng",
      errors: [err.message]
    });
  });
});

// upload file(s)
router.post("/", multer({dest: temp_dir}));
router.post("/", function (req, res) {
  var files = req.files.file;
  var data = req.body;

  if (! req.xhr || ! files) {
    return res.status(400).json({
      status: "ng",
      message: "Bad Request",
      errors: []
    });
  }

  data.name || (data.name = []);

  if (! Array.isArray(data.name)) {
    data.name = [data.name];
  }

  if (! Array.isArray(files)) {
    files = [files];
  }

  var is_errored = files.some(function (file) {
    return file.truncated;
  });

  if (files.length === 0 || is_errored) {
    return res.status(400).json({
      status: "ng",
      message: "Bad Request",
      errors: []
    });
  }

  files = files.map(function (file) {
    file.user = req.user;
    return file;
  });

  libs.file.save(files, upload_dir).then(function (files) {
    files = files.map(function (file, index) {
      return {
        id: file.id,
        name: data.name[index] || file.originalname,
        type: file.type,
        path: file.filepath,
        size: file.size,
        user: file.user._id
      };
    });

    return models.File.create(files);
  }).then(function (files) {
    res.json({
      status: "ok",
      files: files
    });
  }).catch(function (err) {
    res.status(500).json({
      status: "ng",
      errors: [err.message]
    });
  });
});

router.get("/:file_id", function (req, res) {
  new Promise(function (resolve, reject) {
    models.File.findOne({
      id: req.params.file_id
    })
    .populate("user")
    .exec().then(resolve, reject);
  }).then(function (file) {
    res.json({
      status: "ok",
      file: file
    });
  }).catch(function (err) {
    res.status(500).json({
      status: "ng",
      errors: [err.message]
    });
  });
});

router.put("/:file_id", function (req, res) {
  if (! req.xhr) {
    return res.status(400).json({
      status: "ng",
      errors: ["Bad Request"]
    });
  }

  var query = {
    id: req.params.file_id
  };

  if (! res.locals.admin) {
    query.user = req.user._id;
  }

  var data = req.body;

  new Promise(function (resolve, reject) {
    models.File.update(query, data)
    .exec().then(resolve, reject);
  }).then(function () {
    res.json({
      status: "ok"
    });
  }).catch(function (err) {
    res.status(500).json({
      status: "ng",
      errors: [err.message]
    });
  });
});

router.delete("/:file_id", function (req, res) {
  if (! req.xhr) {
    return res.status(400).json({
      status: "ng",
      errors: ["Bad Request"]
    });
  }

  var query = {
    id: req.params.file_id
  };

  if (! res.locals.admin) {
    query.user = req.user._id;
  }

  new Promise(function (resolve, reject) {
    models.File.findOneAndRemove(query)
    .exec().then(resolve, reject);
  }).then(function (file) {
    if (file === null) {
      throw Error("file not found");
    }
    return libs.file.remove([file], upload_dir);
  }).then(function () {
    res.json({
      status: "ok"
    });
  }).catch(function (err) {
    if (err.message === "file not found") {
      return res.status(404).json({
        status: "ng",
        errors: [err.message]
      });
    }

    res.status(500).json({
      status: "ng",
      errors: [err.message]
    });
  });
});

module.exports = router;
