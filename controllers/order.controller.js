const orderService = require("../services/order.service");

const asyncHandler = require("../utils/asyncHandler");

// ============================================================
// CREATE ORDER
// ============================================================

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(
    req.user.userId,
    req.body
  );

  return res.status(201).json({
    success: true,

    message: "Order created successfully",

    data: {
      order,
    },
  });
});

// ============================================================
// UPDATE ORDER PRICING INPUTS
// Student changes deadline/pages/line spacing
// Backend recalculates the price
// ============================================================

const updateOrderPricing = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderPricing(
    req.params.orderId,
    req.user.userId,
    req.body
  );

  return res.status(200).json({
    success: true,

    message: "Order pricing updated successfully",

    data: {
      order,
    },
  });
});

// ============================================================
// CONFIRM ORDER
// ============================================================

const confirmOrder = asyncHandler(async (req, res) => {
  const order = await orderService.confirmOrder(
    req.params.orderId,
    req.user.userId
  );

  return res.status(200).json({
    success: true,

    message: "Order confirmed. Payment is now required.",

    data: {
      order,
    },
  });
});

// ============================================================
// GET STUDENT ORDER
// ============================================================

const getStudentOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getStudentOrder(
    req.params.orderId,
    req.user.userId
  );

  return res.status(200).json({
    success: true,

    data: {
      order,
    },
  });
});

// ============================================================
// GET LOGGED IN STUDENT ORDERS
// ============================================================

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.findStudentOrders(
    req.user.userId
  );
  return res.status(200).json({
    success: true,
    data: {
      orders,
    },
  });

});

// ============================================================
// UPDATE ORDER PRICE
// Admin / Sales Agent
// ============================================================

const updatePrice = asyncHandler(async (req, res) => {
  const order = await orderService.updatePrice(
    req.params.orderId,
    req.user,
    req.body
  );

  return res.status(200).json({
    success: true,

    message: "Order price updated successfully",

    data: {
      order,
    },
  });
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createOrder,
  updateOrderPricing,
  confirmOrder,
  getStudentOrder,
  getMyOrders,
  updatePrice,
};