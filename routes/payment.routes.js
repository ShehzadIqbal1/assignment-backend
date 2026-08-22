const express = require("express");

const authenticate = require("../middleware/auth.middleware");

const authorize = require("../middleware/role.middleware");

const validate = require("../middleware/validate.middleware");

const ROLES = require("../constants/roles");

const controller = require("../controllers/payment.controller");

const {
  createPaymentIntentValidator,
} = require("../validators/payment.validator");

const router = express.Router();

// ============================================================
// CREATE PAYMENT INTENT
// ============================================================

router.post(
  "/orders/:orderId/payment-intent",

  authenticate,

  authorize(ROLES.STUDENT),

  createPaymentIntentValidator,

  validate,

  controller.createPaymentIntent,
);

module.exports = router;
