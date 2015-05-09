/**
 * Upload Client
 *
 */
/* globals Vue, Materialize, moment */

(function () {
  var vm = new Vue({
    el: "main",
    data: {
      token: "",
      user_id: "",
      files: null
    },
    created: function () {
      this.fetch();
    },
    filters: {
      nameFormat: function (name) {
        if (typeof name === "undefined") {
          return "unknown";
        }
        return name.last + " " + name.first;
      },
      dateFormat: function (str) {
        return moment(str).format("YYYY/MM/DD hh:mm:ss");
      },
      sizeFormat: function (num) {
        var SI = ["", "K", "M", "G", "T", "P"];
        for (var i = 0; num > 1024; i++) {
          num /= 1024;
        }
        return Math.floor(num * 100) / 100 + SI[i] + "B";
      },
      formatPath: function (filepath) {
        return "/upload/" + filepath + "?download=true";
      },
      ownerCheck: function (file) {
        return file.user && file.user._id === vm.$data.user_id;
      }
    },
    methods: {
      fetch: function () {
        $.ajax({
          url: "/upload/files.json",
          dataType: "json"
        }).done(function (data) {
          if (data.status === "ng") {
            return console.error(data);
          }

          vm.$data.files = data.files;
        }).fail(function (err) {
          console.error(err);
        });
      },
      upload: function (event) {
        event.preventDefault();

        var $form = $(event.target);

        $.ajax({
          method: $form.attr("method"),
          url: $form.attr("action"),
          data: new FormData(event.target),
          dataType: "json",
          processData: false,
          contentType: false
        }).done(function (data) {
          console.log(data);

          setTimeout(function () {
            Materialize.toast("Uploaded.", 3000);
            vm.fetch();
          }, 500);

          $("#upload").closeModal();
        }).fail(function (xhr) {
          var res = JSON.parse(xhr.responseText);
          console.error(res);
          Materialize.toast("⚠error", 3000);
        });
      },
      remove: function (event, file) {
        var csrf_token = "?_csrf=" + vm.$data.token;

        $.ajax({
          method: "delete",
          url: "/upload/" + file.id + csrf_token,
          dataType: "json",
          processData: false,
          contentType: false
        }).done(function (data) {
          console.log(data);

          setTimeout(function () {
            Materialize.toast("Deleted.", 3000);
            vm.fetch();
          }, 500);
        }).fail(function (xhr) {
          var res = JSON.parse(xhr.responseText);
          console.error(res);
          Materialize.toast("⚠error", 3000);
        });
      }
    }
  });
})();

$(function () {
  $("button.modal-trigger").leanModal();
});
