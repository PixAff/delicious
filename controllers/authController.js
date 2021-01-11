const mongoose = require("mongoose");
const User = mongoose.model("User");
const passport = require("passport");
const crypto = require("crypto");
const promisify = require("es6-promisify");

const mail = require("../handlers/mail");

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
  if (!user) {
    req.flash("success", "If you have an account we emailed you a link.");
    return res.redirect("/login");
  }

  user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordExpires = Date.now() + 3600000;

  await user.save();

  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: "Passowrd reset",
    resetURL,
    filename: "password-reset",
  });
  req.flash("success", `If you have an account we emailed you a link`);
  res.redirect("/login");
};

exports.resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "The reset token is invalid or has expired");
    return res.redirect("/login");
  }
  res.render("reset", { title: "Reset your password" });
};

exports.confirmedPassword = (req, res, next) => {
  if (req.body.password === req.body["password-confirm"]) {
    next();
    return;
  }
  req.flash("error", "Passwords do not match");
  res.redirect("back");
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "The reset token is invalid or has expired");
    return res.redirect("/login");
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash("success", "Password updated");
  res.redirect("/");
};
