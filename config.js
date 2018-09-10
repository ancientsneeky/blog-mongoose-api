"use strict";
exports.DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://ancientsneeky:Notrealpw1@ds247852.mlab.com:47852/blog-api";
exports.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || "mongodb://localhost/test-blog-app";
exports.PORT = process.env.PORT || 8080;
