/**
 * New (registration)
 *
 */
/* globals Vue, Materialize */

(function () {
  var vm = new Vue({
    el: "main",
    data: {
      email: ""
    },
    ready: function () {
      var data = this.$data;
      Object.keys(data).filter(function (key) {
        return key.slice(0, 5) === "team_";
      }).forEach(function (key) {
        data[key] = false;
      });
    },
    methods: {
      save: function (event) {
        event.preventDefault();

        var $form = $(event.target);
        var data = {
          email: vm.$data.email,
          team: []
        };

        data.team = $form.serializeArray().filter(function (input) {
          return input.name === "team";
        }).map(function (input) {
          return input.value;
        });

        $.ajax({
          method: $form.attr("method"),
          url: $form.attr("action"),
          data: JSON.stringify(data),
          dataType: "json",
          contentType: "application/json"
        }).done(function (data) {
          setTimeout(function () {
            location.reload(true);
          }, 500);

          console.log(data);
          Materialize.toast("Registered.", 3000);
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
  $("select").material_select();
});
