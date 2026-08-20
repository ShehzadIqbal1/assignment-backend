const express = require("express");

const authController = require("../controllers/auth.controller");

const authenticate = require("../middleware/auth.middleware");

const validate = require("../middleware/validate.middleware");

const {
  signupValidator,
  loginValidator,
  emailAvailabilityValidator,
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/signup", signupValidator, validate, authController.signup);

router.post("/login", loginValidator, validate, authController.login);

router.get(
  "/check-email",
  emailAvailabilityValidator,
  validate,
  authController.checkEmail,
);

router.get("/me", authenticate, authController.me);

module.exports = router;
