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
// UPDATE ORDER  INPUTS
// Student can update complete order inputs
// Backend recalculates the price
// ============================================================

const updateOrder = asyncHandler(async(req,res)=>{

 const order = await orderService.updateOrder(
    req.params.orderId,
    req.user.userId,
    req.body
 );

 return res.status(200).json({

    success:true,

    message:"Order updated successfully",

    data:{
       order
    }

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
  updateOrder,
  confirmOrder,
  getStudentOrder,
  getMyOrders,
  updatePrice,
};