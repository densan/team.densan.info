/**
 * Bootstrap
 * boot.js
 */

var mode = process.argv[2] || "production",
    pass = process.argv[3] || null;

switch (mode) {
  case "maintenance":
    if (pass === null)
      throw new Error("maintenance pass is required.");
  case "development":
  case "production":
    break;
  default:
    throw new Error(mode + " mode is not defined.");
}

process.env.NODE_ENV = mode;
process.env.MAINTENANCE_PASS = pass;

require("./server");