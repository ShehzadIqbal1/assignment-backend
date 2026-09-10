const express = require("express");

const authenticate = require("../middleware/auth.middleware");

const authorize = require("../middleware/role.middleware");

const validate = require("../middleware/validate.middleware");

const controller = require("../controllers/order.controller");

const ROLES = require("../constants/roles");

const {
  createOrderValidator,
  orderIdValidator,
  updateOrderValidator,
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

//=======================================================
//STUDENT EDIT ORDER  INPUTS
//=======================================================
router.patch(
  "/:orderId",
  authenticate,
  authorize(ROLES.STUDENT),
  updateOrderValidator,
  validate,
  controller.updateOrder,
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

//get student oder based on studentId
router.get(
  "/my-orders",
  authenticate,
  authorize(ROLES.STUDENT),
  controller.getMyOrders,
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
