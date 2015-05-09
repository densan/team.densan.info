/**
 * Common
 *
 */
/* globals Vue */

Vue.config.delimiters = ["[[", "]]"];

window.addEventListener("error", function (err) {
  console.error(err);
});

$(function () {
  // initialize navbar collapse
  $("nav .button-collapse").sideNav();
});
