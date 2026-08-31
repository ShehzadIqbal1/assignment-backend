const { body, query } = require("express-validator");

const signupValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("countryCode")
    .trim()
    .notEmpty()
    .withMessage("Country code is required")
    .matches(/^\+\d{1,4}$/)
    .withMessage("Invalid country code"),

  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\d{6,20}$/)
    .withMessage("Please provide a valid phone number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({
      min: 8,
    })
    .withMessage("Password must contain at least 8 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),

  body("tag")
    .trim()
    .notEmpty()
    .withMessage("Website tag is required")
    .isLength({
      max: 100,
    })
    .withMessage("Website tag cannot exceed 100 characters"),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

const emailAvailabilityValidator = [
  query("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

module.exports = {
  signupValidator,
  loginValidator,
  emailAvailabilityValidator,
};
