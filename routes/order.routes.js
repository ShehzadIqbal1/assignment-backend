const express = require("express");

const authenticate = require("../middleware/auth.middleware");

const authorize = require("../middleware/role.middleware");

const validate = require("../middleware/validate.middleware");

const controller = require("../controllers/order.controller");

const ROLES = require("../constants/roles");

const {
  createOrderValidator,
  orderIdValidator,
  updateOrderPricingValidator,
  updatePriceValidator,
} = require("../validators/order.validator");

const router = express.Router();

// ============================================================
// STUDENT CREATE ORDER
// ============================================================

router.post(
  "/",

  authenticate,

  authorize(ROLES.STUDENT),

  createOrderValidator,

  validate,

  controller.createOrder,
);

// ============================================================
// STUDENT CHANGE PRICING INPUTS
// ============================================================

router.patch(
  "/:orderId/pricing",

  authenticate,

  authorize(ROLES.STUDENT),

  updateOrderPricingValidator,

  validate,

  controller.updateOrderPricing,
);

// ============================================================
// STUDENT CONFIRM ORDER
// ============================================================

router.post(
  "/:orderId/confirm",

  authenticate,

  authorize(ROLES.STUDENT),

  orderIdValidator,

  validate,

  controller.confirmOrder,
);

// ============================================================
// STUDENT GET OWN ORDER
// ============================================================

router.get(
  "/:orderId",

  authenticate,

  authorize(ROLES.STUDENT),

  orderIdValidator,

  validate,

  controller.getStudentOrder,
);

// ============================================================
// ADMIN / SALES AGENT EDIT PRICE
// ============================================================

router.patch(
  "/:orderId/price",

  authenticate,

  authorize(ROLES.ADMIN, ROLES.SALES_AGENT),

  updatePriceValidator,

  validate,

  controller.updatePrice,
);

module.exports = router;
