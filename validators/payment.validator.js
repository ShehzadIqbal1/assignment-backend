const { param, body } = require("express-validator");

// ============================================================
// CREATE PAYMENT INTENT
// ============================================================

const createPaymentIntentValidator = [
  param("orderId").isMongoId().withMessage("Invalid order ID"),

  body("paymentMethod")
    .optional()
    .isIn(["stripe"])
    .withMessage("Unsupported payment method"),
];

module.exports = {
  createPaymentIntentValidator,
};
