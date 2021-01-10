const mongoose = require("mongoose");
const User = mongoose.model("User");
const passport = require("passport");
const crypto = require("crypto");

exports.login = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: "Failed login!",
  successRedirect: "/",
  successFlash: "You are logged in",
});

exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You are logged out now.");
  res.redirect("/");
};

exports.isLoogedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash("error", "Oops! You must be logged in to add a store!");
  res.redirect("/login");
};

exports.forgot = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  res.json(user);
};
