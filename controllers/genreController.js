var Genre = require("../models/genre");
var Book = require("../models/book");
var async = require("async");
var { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = function (req, res, next) {
  Genre.find().exec(function (err, list_genre) {
    if (err) {
      return next(err);
    }
    res.render("genre_list", { title: "Genre List", genre_list: list_genre });
  });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        var err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and santize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ name: req.body.name }).exec(function (err, found_genre) {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
        } else {
          genre.save(function (err) {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        next(err);
      }

      if (results.genre === null) {
        res.redirect("/catalog/genre");
      }

      res.render("genre_delete", {
        genre: results.genre,
        books: results.books,
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        next(err);
      }

      if (results.books.length > 0) {
        res.render("genre_delete", {
          genre: results.genre,
          books: results.books,
        });
      }

      Genre.findByIdAndRemove(req.body.genreid, function (err) {
        if (err) {
          next(err);
        }

        res.redirect("/catalog/genres");
      });
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
  // Get existing genre
  Genre.findById(req.params.id).exec(function (err, genre) {
    // If error pass to middleware
    if (err) {
      return next(err);
    }

    // Load form with genre data
    res.render("genre_form", { title: "Update Genre", genre: genre });
    return;
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("You need to enter a name for Genre")
    .isAlphanumeric()
    .withMessage("Your name must be alphanumeric"),

  function (req, res, next) {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    }

    Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
      if (err) {
        return next(err);
      }
      res.redirect("/catalog/genres");
    });
  },
  /* 
  Logic
  - Sanitise the data (e.g. body("name").trim().isLength({min: 1}).escape().withMessage("You need to enter a name for the genre"))
  - In the next item in the array do a fresh (req, res, next)
  - Check for validation errors using the validationResult library
  - Create a new Genre with the req.params.id as _id
  - Check if (!errors.isEmpty())
  - if errors exist then re-render the page and pass in the errors
  - Else Genre.findByIdandUpdate(req.params.id, genre, {}, function(err, thegenre) {
    if (err) {
      return next(err)
    }
    res.redirect("/catalog/genres")
  })
  */
];
