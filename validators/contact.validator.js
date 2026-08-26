const { body } = require("express-validator");

const contactValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("tag").trim().notEmpty().withMessage("Website tag is required"),
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
];

module.exports = contactValidator;
