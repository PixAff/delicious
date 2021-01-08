const passport = require("passport");

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
