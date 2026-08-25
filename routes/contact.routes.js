const express = require("express");

const router = express.Router();

const { submitContactForm } = require("../controllers/contact.controller");

const contactValidator = require("../validators/contact.validator");

const validate = require("../middleware/validate.middleware");

router.post("/", contactValidator, validate, submitContactForm);

module.exports = router;
