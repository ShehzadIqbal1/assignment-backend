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
  /*
   * Pricing depends ONLY on:
   * 1. Deadline
   * 2. Line spacing
   *
   * Number of pages has no impact on pricing.
   */

  const pricing = calculatePrice({
    deadline: data.deadline,
    lineSpacing: data.lineSpacing,
  });

  const order = await orderRepository.createOrder({
    studentId,

    // Website source tag
    // Example:
    // tutorify
    // assignmentmavens
    tag: data.tag,

    assignmentType: data.assignmentType,

    academicLevel: data.academicLevel,

    subject: data.subject,

    title: data.title,

    deadline: data.deadline,

    // Stored for assignment details only
    // NOT used in pricing
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
// Student can update:
// - deadline
// - numberOfPages
// - lineSpacing
//
// Price recalculates ONLY using:
// - deadline
// - lineSpacing
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

  // -------------------------------
  // Update order inputs
  // -------------------------------

  if (data.deadline !== undefined) {
    order.deadline = data.deadline;
  }

  if (data.numberOfPages !== undefined) {
    order.numberOfPages = data.numberOfPages;
  }

  if (data.lineSpacing !== undefined) {
    order.lineSpacing = data.lineSpacing;
  }

  /*
   * IMPORTANT:
   *
   * Pages are ignored here.
   *
   * Price =
   * deadline × lineSpacing
   */

  const pricing = calculatePrice({
    deadline: order.deadline,

    lineSpacing: order.lineSpacing,
  });

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
   * Final price calculation before payment.
   *
   * Pages are ignored.
   */

  const pricing = calculatePrice({
    deadline: order.deadline,
    lineSpacing: order.lineSpacing,
  });

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

  const calculatedAmount = order.pricing.calculatedAmount;

  const providedOptions = [
    discountAmount !== undefined,
    discountPercentage !== undefined,
    finalAmount !== undefined,
  ].filter(Boolean).length;

  if (providedOptions !== 1) {
    throw new ApiError(400, "Provide exactly one pricing modification");
  }

  let newDiscountAmount = 0;

  let newDiscountPercentage = 0;

  let newFinalAmount = calculatedAmount;

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

  if (finalAmount !== undefined) {
    if (finalAmount < 0 || finalAmount > calculatedAmount) {
      throw new ApiError(400, "Final amount cannot exceed calculated price");
    }

    newFinalAmount = Number(finalAmount.toFixed(2));

    newDiscountAmount = Number((calculatedAmount - newFinalAmount).toFixed(2));

    newDiscountPercentage = Number(
      ((newDiscountAmount / calculatedAmount) * 100).toFixed(2),
    );
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
