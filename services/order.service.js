const Order = require("../models/Order");
const OrderEvent = require("../models/OrderEvent");

const orderRepository = require("../repositories/order.repository");

const paymentRepository = require("../repositories/payment.repository");

const { calculatePrice } = require("./pricing.service");

const ORDER_STATUS = require("../constants/orderStatus");

const ROLES = require("../constants/roles");

const ApiError = require("../utils/ApiError");

// ============================================================
// CREATE ORDER
// ============================================================

const createOrder = async (studentId, data) => {
  const pricing = calculatePrice({
    deadline: data.deadline,
    numberOfPages: data.numberOfPages,
    lineSpacing: data.lineSpacing,
  });

  const order = await orderRepository.createOrder({
    studentId,

    assignmentType: data.assignmentType,

    academicLevel: data.academicLevel,

    subject: data.subject,

    title: data.title,

    deadline: data.deadline,

    numberOfPages: data.numberOfPages,

    wordCount: data.wordCount || 0,

    lineSpacing: data.lineSpacing,

    guidelines: data.guidelines || "",

    citationStyle: data.citationStyle || "",

    references: data.references || 0,

    fontStyle: data.fontStyle || "",

    language: data.language || "",

    pricing,

    status: ORDER_STATUS.DRAFT,

    paymentStatus: "pending",
  });

  await OrderEvent.create({
    orderId: order._id,

    userId: studentId,

    role: ROLES.STUDENT,

    action: "orderCreated",

    toStatus: ORDER_STATUS.DRAFT,
  });

  return order;
};

// ============================================================
// UPDATE ORDER PRICING INPUTS
//
// Student can change deadline/pages/line spacing before payment.
// Backend recalculates the price.
// Client NEVER sends the price.
// ============================================================

const updateOrderPricing = async (orderId, studentId, data) => {
  const order = await orderRepository.findStudentOrder(orderId, studentId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const allowedStatuses = [ORDER_STATUS.DRAFT, ORDER_STATUS.AWAITING_PAYMENT];

  if (!allowedStatuses.includes(order.status)) {
    throw new ApiError(400, "Order pricing can no longer be changed");
  }

  // --------------------------------------------------------
  // Check for an active/processing payment
  // --------------------------------------------------------

  const existingPayment = await paymentRepository.findByOrder(orderId);

  if (
    existingPayment &&
    ["processing", "succeeded"].includes(existingPayment.status)
  ) {
    throw new ApiError(
      400,
      "Order price cannot be changed while payment is processing or completed",
    );
  }

  // --------------------------------------------------------
  // Update only pricing-related selections
  // --------------------------------------------------------

  if (data.deadline !== undefined) {
    order.deadline = data.deadline;
  }

  if (data.numberOfPages !== undefined) {
    order.numberOfPages = data.numberOfPages;
  }

  if (data.lineSpacing !== undefined) {
    order.lineSpacing = data.lineSpacing;
  }

  // --------------------------------------------------------
  // Backend recalculates
  // --------------------------------------------------------

  const pricing = calculatePrice({
    deadline: order.deadline,

    numberOfPages: order.numberOfPages,

    lineSpacing: order.lineSpacing,
  });

  /*
   * Recalculate from the ORIGINAL calculation.
   *
   * Any previous discount becomes invalid when the
   * pricing inputs change.
   */

  order.pricing = {
    ...pricing,

    discountAmount: 0,

    discountPercentage: 0,

    finalAmount: pricing.calculatedAmount,

    priceVersion: (order.pricing.priceVersion || 1) + 1,

    priceEditedBy: null,

    priceEditedAt: null,

    discountReason: "",
  };

  await order.save();

  await OrderEvent.create({
    orderId: order._id,

    userId: studentId,

    role: ROLES.STUDENT,

    action: "orderPricingUpdated",

    metadata: {
      deadline: order.deadline,

      numberOfPages: order.numberOfPages,

      lineSpacing: order.lineSpacing,

      calculatedAmount: order.pricing.calculatedAmount,
    },
  });

  return order;
};

// ============================================================
// CONFIRM ORDER
// ============================================================

const confirmOrder = async (orderId, studentId) => {
  const order = await orderRepository.findStudentOrder(orderId, studentId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== ORDER_STATUS.DRAFT) {
    throw new ApiError(400, "Only draft orders can be confirmed");
  }

  const previousStatus = order.status;

  /*
   * Recalculate one final time before confirmation.
   *
   * This protects us even if the frontend's displayed
   * price is stale.
   */

  const pricing = calculatePrice({
    deadline: order.deadline,
    lineSpacing: order.lineSpacing,
  });

  /*
   * Confirmation resets any accidental stale discount.
   * Admin/Sales can apply a discount after confirmation.
   */

  order.pricing = {
    ...pricing,

    discountAmount: 0,

    discountPercentage: 0,

    finalAmount: pricing.calculatedAmount,

    priceVersion: (order.pricing.priceVersion || 1) + 1,

    priceEditedBy: null,

    priceEditedAt: null,

    discountReason: "",
  };

  order.status = ORDER_STATUS.AWAITING_PAYMENT;

  order.paymentStatus = "pending";

  await order.save();

  await OrderEvent.create({
    orderId: order._id,

    userId: studentId,

    role: ROLES.STUDENT,

    action: "orderConfirmed",

    fromStatus: previousStatus,

    toStatus: ORDER_STATUS.AWAITING_PAYMENT,

    metadata: {
      finalAmount: order.pricing.finalAmount,
    },
  });

  return order;
};

// ============================================================
// GET STUDENT ORDER
// ============================================================

const getStudentOrder = async (orderId, studentId) => {
  const order = await orderRepository.findStudentOrder(orderId, studentId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return order;
};

// ============================================================
// ADMIN / SALES AGENT PRICE UPDATE
// ============================================================

const updatePrice = async (
  orderId,
  actor,
  { discountAmount, discountPercentage, finalAmount, discountReason },
) => {
  if (![ROLES.ADMIN, ROLES.SALES_AGENT].includes(actor.role)) {
    throw new ApiError(403, "Only admin or sales agent can edit order pricing");
  }

  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== ORDER_STATUS.AWAITING_PAYMENT) {
    throw new ApiError(400, "Price can only be changed before payment");
  }

  const existingPayment = await paymentRepository.findByOrder(orderId);

  if (
    existingPayment &&
    ["processing", "succeeded"].includes(existingPayment.status)
  ) {
    throw new ApiError(
      400,
      "Price cannot be changed while payment is processing or completed",
    );
  }

  const calculatedAmount = order.pricing.calculatedAmount;

  const providedOptions = [
    discountAmount !== undefined,

    discountPercentage !== undefined,

    finalAmount !== undefined,
  ].filter(Boolean).length;

  if (providedOptions !== 1) {
    throw new ApiError(
      400,
      "Provide exactly one of discountAmount, discountPercentage, or finalAmount",
    );
  }

  let newDiscountAmount = 0;

  let newDiscountPercentage = 0;

  let newFinalAmount = calculatedAmount;

  // --------------------------------------------------------
  // Discount amount
  // --------------------------------------------------------

  if (discountAmount !== undefined) {
    if (discountAmount < 0 || discountAmount > calculatedAmount) {
      throw new ApiError(400, "Invalid discount amount");
    }

    newDiscountAmount = Number(discountAmount.toFixed(2));

    newFinalAmount = Number((calculatedAmount - newDiscountAmount).toFixed(2));

    newDiscountPercentage = Number(
      ((newDiscountAmount / calculatedAmount) * 100).toFixed(2),
    );
  }

  // --------------------------------------------------------
  // Discount percentage
  // --------------------------------------------------------

  if (discountPercentage !== undefined) {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new ApiError(400, "Discount percentage must be between 0 and 100");
    }

    newDiscountPercentage = Number(discountPercentage.toFixed(2));

    newDiscountAmount = Number(
      (calculatedAmount * (newDiscountPercentage / 100)).toFixed(2),
    );

    newFinalAmount = Number((calculatedAmount - newDiscountAmount).toFixed(2));
  }

  // --------------------------------------------------------
  // Direct final amount
  // --------------------------------------------------------

  if (finalAmount !== undefined) {
    if (finalAmount < 0 || finalAmount > calculatedAmount) {
      throw new ApiError(
        400,
        "Final price must be between 0 and the calculated price",
      );
    }

    newFinalAmount = Number(finalAmount.toFixed(2));

    newDiscountAmount = Number((calculatedAmount - newFinalAmount).toFixed(2));

    newDiscountPercentage =
      calculatedAmount === 0
        ? 0
        : Number(((newDiscountAmount / calculatedAmount) * 100).toFixed(2));
  }

  order.pricing.discountAmount = newDiscountAmount;

  order.pricing.discountPercentage = newDiscountPercentage;

  order.pricing.finalAmount = newFinalAmount;

  order.pricing.discountReason = discountReason || "";

  order.pricing.priceEditedBy = actor.userId;

  order.pricing.priceEditedAt = new Date();

  order.pricing.priceVersion += 1;

  await order.save();

  await OrderEvent.create({
    orderId: order._id,

    userId: actor.userId,

    role: actor.role,

    action: "priceUpdated",

    metadata: {
      oldAmount: calculatedAmount,

      discountAmount: newDiscountAmount,

      discountPercentage: newDiscountPercentage,

      newFinalAmount,

      reason: discountReason || null,
    },
  });

  return order;
};

module.exports = {
  createOrder,
  updateOrderPricing,
  confirmOrder,
  getStudentOrder,
  updatePrice,
};
