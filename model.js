"use strict";

const mongoose = require("mongoose");

// this is our blog schema
const blogSchema = mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: {
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
  },
});

blogSchema.virtual("nameString").get(function() {
  return `${this.author.bufirstNameilding} ${this.author.lastName}`.trim();
});

blogSchema.methods.serialize = function() {
  return {
    id: this._id,
    author: this.nameString,
    title: this.title,
    content: this.content
  };
};

const blog = mongoose.model("blog", blogSchema);

module.exports = { blog };
