/**
 * ajax.js
 * send data & error handling
 */

(function ($) {
  $.densan || ($.densan = {});
  $.densan.ajax = function (params) {
    if (! params.data || params.data.length < 1)
      throw new Error("params.data is invalid");
    if (typeof params.url !== "string")
      throw new TypeError("params.url must be String");

    var $ajax = $.ajax({
      type: "post",
      url: params.url,
      dataType: "json",
      data: params.data
    });

    $ajax.done(function (res) {
      if (res.message === "OK")
        return params.done && params.done();
      return params.fail && params.fail();
    });

    $ajax.fail(function (xhr) {
      var res = {};
      try {
        res = JSON.parse(xhr.responseText);
      } catch (e) {
        // JSON parse error
        console.log(e);
      } finally {
        if (res.message !== "Error")
          return params.fail && params.fail();
        return params.fail && params.fail(res.errors);
      }
    });
  };
})(jQuery);