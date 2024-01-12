const express = require("express");
const router = express.Router();
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const users = [];

const signupSchema = Joi.object({
  username: Joi.string().min(3).max(10).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .pattern(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,}$/
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 5 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(5).required(),
});

router.get("/", (req, res) => {
  res.render("index", { error: null });
});

router.post("/", (req, res) => {
  const { error } = signupSchema.validate(req.body);

  if (error) {
    res.render("index", { error: error.details[0].message });
  } else {
    const { username, email, password } = req.body;
    users.push({ username, email, password });
    res.redirect("/login");
  }
});

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", (req, res) => {
  const { error } = loginSchema.validate(req.body);

  if (error) {
    res.render("login", { error: error.details[0].message });
  } else {
    const { email, password } = req.body;
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, username: user.username },
        "userSecretKey"
      );
      res.cookie("jwt", token, { httpOnly: true }); // Set JWT token as a cookie
      res.redirect("/profile");
    } else {
      res
        .status(401)
        .render("login", {
          error: "Invalid email or password. Please try again.",
        });
    }
  }
});

const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, "userSecretKey"); 
    req.user = decoded;
    next();
  } catch (error) {
    return res.redirect("/login"); // Redirect to login on token verification failure
  }
};

router.get("/profile", verifyToken, (req, res) => {
  // The user is authenticated, you can access req.user to get user details
  res.render("profile", { user: req.user.username });
});
router.post("/logout", (req, res) => {
  res.clearCookie("jwt"); // Clear the JWT cookie
  res.redirect("/"); // Redirect to the signup page
});

module.exports = router;
