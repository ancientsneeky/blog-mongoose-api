"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;


const authorSchema = mongoose.Schema({
	firstName: {type: "string", required: true},
    lastName: {type: "string", required: true},
    userName: {type: "string", unique: true, required: true}
});

const commentSchema = mongoose.Schema({content: "string"});

const blogSchema = mongoose.Schema({
  title: { type: "string", required: true },
  content: { type: "string", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Author"},
  created: { type: Date, default: Date.now },
  comments: [commentSchema]
});

// pre hook author access for serialize
blogSchema.pre('find', function(next) {
	this.populate('author');
	next();
});

// pre hook author access for serialize
blogSchema.pre('findOne', function(next) {
	this.populate('author');
	next();
});

authorSchema.virtual("nameString").get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

blogSchema.methods.serialize = function() {
  return {
    id: this._id,
    author: this.nameString,
    title: this.title,
    content: this.content,
    created: this.created,
    comments: this.comments
  };
};

authorSchema.methods.serialize = function() {
	return {
		id: this._id,
		username: this.userName,
		author: this.nameString
	};
};


const Author = mongoose.model("Author", authorSchema);
const Blog = mongoose.model("BlogPosts", blogSchema);


module.exports = { Blog, Author };
