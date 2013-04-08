/**
 * Bootstrap
 * boot.js
 */

var mode = process.argv[2] || "production";

process.env.NODE_ENV = mode;

require("./server");