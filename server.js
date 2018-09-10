"use strict";

const express = require("express");
const mongoose = require("mongoose");
// const bodyParser = require('body-parser');
const morgan = require('morgan');

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { Blog, Author } = require("./models");

const app = express();
app.use(express.json());

// app.use(bodyParser.json());

app.use(morgan('common'));

app.get("/posts", (req, res) => {
  Blog.find()
    .then(blogs => {
      res.json(blogs.map(blog => {
      	return {
      		id: blog._id,
      		author: blog.author,
      		content: blog.content,
      		title: blog.title
      	};
      }));
  })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal server error on GET /posts" });
    });
});

// app.get('/blogs', (req, res) => {
//     const filters = {};
//     const queryableFields = ['cuisine', 'borough'];
//     console.log(req.query);
//     queryableFields.forEach(field => {
    	
//         if (req.query[field]) {
//         	console.log(req.query[field])
//             filters[field] = req.query[field];
//         }
//     });
//     Blog
//         .find(filters)
//         .then(blogs => res.json(
//             blogs.map(Blog => Blog.serialize())
//         ))
//         .catch(err => {
//             console.error(err);
//             res.status(500).json({message: 'Internal server error'})
//         });
// });

// can also request by ID
app.get("/posts/:id", (req, res) => {
  Blog
    .findById(req.params.id)
    .then(Blog => res.json(Blog.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    });
});

app.post("/posts", (req, res) => {
  const requiredFields = ["title", "author_id", "content"];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  Author.findById(req.body.author_id)
  		.then(author => {
  			if (author) {
  				Blog.create({
    				title: req.body.title,
					content: req.body.content,
					author: req.body.id
  				})
    			.then(blog => res.status(201).json(blog.serialize()))
    			.catch(err => {
      				console.error(err);
      				res.status(500).json({ message: "Internal server error on POST /posts" });
    			});
  			} else {
  				const message = 'Author not found';
  				console.error(message);
  				return res.status(400).send(message);
  			}
  		}).catch(err => {
  			console.error(err);
  			res.status(500).json({error: "Internal server error on POST /posts"})
  		});
});

app.put("/posts/:id", (req, res) => {
  // ensure that the id in the request path and the one in request body match
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message =
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({ message: message });
  }
	//create a object of items we allow to be updated
  const toUpdate = {};
  const updateableFields = ["title", "content"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });
  Blog.findByIdAndUpdate(req.params.id, { $set: toUpdate }, {new: true})
    .then(blog => res.status(200).json({
    	title: blog.title,
    	content: blog.content,
    	author: blog.author.nameString,
    	created: blog.created
    }))
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

app.delete("/posts/:id", (req, res) => {
  Blog.findByIdAndRemove(req.params.id)
    .then(blog => res.status(204).end())
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

app.get("/authors", (req, res) => {
	Author.find()
	.then(authors => {
		res.json(authors.map(author => {
			return {
				id: author._id,
				name: author.nameString,
				userName: author.userName
			};
		}));
	})
	.catch(err => {
		console.error(err);
		res.status(500).json({error: "Error on GET /authors"});
	});
});

app.get('/authors/:id', (req, res) => {
	Author.findById(req.params.id)
	.then(author => {
		res.json(author.serialize())
	})
	.catch(err => {
		console.error({error: err,
			message: `Error on GET /authors/${req.params.id}`
		});
		res.status(500).json({error: `Error on GET /authors/${req.params.id}`})
	})
})

app.post('/authors', (req, res) => {
	console.log(req.body);
	const requiredFields = ["firstName", "lastName", "userName"];
	for (let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			  const message = `Missing \`${field}\` in request body`;
			  console.error(message);
			  return res.status(400).send(message);
		}
	}

	Author
    .findOne({ userName: req.body.userName })
    .then(author => {
    	//check for unique UID
      if (author) {
        const message = `Username already taken`;
        console.error(message);
        return res.status(400).send(message);
      }
      else {
        Author
          .create({
            lastName: req.body.lastName,
            firstName: req.body.firstName,
            userName: req.body.userName
          })
          .then(author => res.status(201).json({
              _id: author.id,
              name: author.nameString,
              userName: author.userName
            }))
          .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Error on POST /authors' });
          });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Error on POST /authors' });
    });
});

app.put('/authors/:id', (req, res) => {
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message =
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({ message: message });
  }

  // we only support a subset of fields being updateable.
  // if the user sent over any of the updatableFields, we udpate those values
  // in document
  const toUpdate = {};
  const updateableFields = ["firstName", "lastName", "userName"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  //check for unique UID if not Add the not equal UID
  Author.findOne({userName: toUpdate.userName || '', _id: {$ne: req.params.id}})
  .then(author => {
  	if(author) {
  		const message = `Username already taken`;
  		console.error(message);
  		return res.status(400).send(message);
  	} else {
  		Author.findByIdAndUpdate(req.params.id, { $set: toUpdate }, {new: true})
  		.then(author => res.status(200).json({
  			_id: author.id,
  			name: author.nameString,
  			username: author.userName
  		}))
    	.catch(err => res.status(500).json({ message: "Internal server error" }));
  	}
  })
  .catch(err => res.status(500).json({message: err}));
});


app.delete('/authors/:id', (req, res) => {
	Blog.remove({ author: req.params.id})
	.then(() => {
		Author.findByIdAndRemove(req.params.id)
				.then(() => res.status(204).json({message: `deleted ${req.params.id} account and blog posts owned by them`}))
				.catch(err => res.status(500).json({ message: "Internal server error on DELETE /authors" }));
	})
	.catch(err => {
		console.error(err);
		res.status(500).json({error: 'Internal server error on DELETE /authors'});
	});
});

// catch-all endpoint if client makes request to non-existent endpoint
app.use("*", function(req, res) {
  res.status(404).json({ message: "Not Found" });
});

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      databaseUrl,
      err => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(port, () => {
            console.log(`Your app is listening on port ${port}`);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
