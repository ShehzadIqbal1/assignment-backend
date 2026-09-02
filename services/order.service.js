const Order = require("../models/Order");
const OrderEvent = require("../models/OrderEvent");

const orderRepository = require("../repositories/order.repository");
const paymentRepository = require("../repositories/payment.repository");

const { calculatePrice, toSubunit } = require("./pricing.service");

const ORDER_STATUS = require("../constants/orderStatus");
const ROLES = require("../constants/roles");

const ApiError = require("../utils/ApiError");

// ============================================================
// CREATE ORDER
// ============================================================

const createOrder = async (studentId, data) => {
  /*
   * IMPORTANT:
   *
   * Frontend sends pricing INPUTS only:
   *
   * - tag
   * - deadline
   * - numberOfPages
   * - lineSpacing
   * - addOns
   *
   * Frontend must NOT be trusted for:
   *
   * - rate
   * - calculatedAmount
   * - finalAmount
   * - currency
   * - amountInSubunits
   *
   * Backend calculates all pricing.
   */

  const pricing = calculatePrice({
    tag: data.tag,
    deadline: data.deadline,
    lineSpacing: data.lineSpacing,
    numberOfPages: data.numberOfPages,

    // Optional.
    // If frontend doesn't send addOns,
    // pricing.service uses [].
    addOns: data.addOns || [],
  });

  const order = await orderRepository.createOrder({
    studentId,

    // Website source
    tag: pricing.tag,

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

    // Store selected add-on price snapshots
    addOns: pricing.addOns,

    // Store backend-calculated pricing
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
// ============================================================
//
// Student can change:
// complete order inputs
// All pricing is recalculated on backend.
//
// ============================================================

const updateOrder = async (orderId, studentId, data) => {
  const order = await orderRepository.findStudentOrder(orderId, studentId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const allowedStatuses = [ORDER_STATUS.DRAFT, ORDER_STATUS.AWAITING_PAYMENT];

  if (!allowedStatuses.includes(order.status)) {
    throw new ApiError(400, "Order can no longer be edited");
  }

  const existingPayment = await paymentRepository.findByOrder(orderId);

  if (
    existingPayment &&
    ["processing", "succeeded"].includes(existingPayment.status)
  ) {
    throw new ApiError(400, "Order cannot be changed after payment");
  }

  const editableFields = [
    "assignmentType",
    "academicLevel",
    "subject",
    "title",
    "deadline",
    "numberOfPages",
    "wordCount",
    "lineSpacing",
    "guidelines",
    "citationStyle",
    "references",
    "fontStyle",
    "language",
  ];

  editableFields.forEach((field) => {
    if (data[field] !== undefined) {
      order[field] = data[field];
    }
  });

  let selectedAddOns;

  if (data.addOns !== undefined) {
    selectedAddOns = data.addOns;
  } else {
    selectedAddOns = (order.addOns || []).map((a) => a.name);
  }

  const pricing = calculatePrice({
    tag: order.tag,

    deadline: order.deadline,

    lineSpacing: order.lineSpacing,

    numberOfPages: order.numberOfPages,

    addOns: selectedAddOns,
  });

  order.addOns = pricing.addOns;

  order.pricing = {
    ...pricing,

    discountAmount: 0,

    discountPercentage: 0,

    finalAmount: pricing.calculatedAmount,

    priceVersion: order.pricing.priceVersion + 1,

    priceEditedBy: null,

    priceEditedAt: null,

    discountReason: "",
  };

  await order.save();

  await OrderEvent.create({
    orderId: order._id,

    userId: studentId,

    role: ROLES.STUDENT,

    action: "orderUpdated",

    metadata: {
      updatedFields: Object.keys(data),
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

  // ----------------------------------------------------------
  // Final backend price calculation
  // ----------------------------------------------------------
  //
  // We use the order's stored tag.
  // We DO NOT accept price from frontend.
  //
  // Existing selected add-ons are preserved.
  // ----------------------------------------------------------

  const selectedAddOns = (order.addOns || []).map((addon) => addon.name);

  const pricing = calculatePrice({
    tag: order.tag,

    deadline: order.deadline,

    lineSpacing: order.lineSpacing,

    numberOfPages: order.numberOfPages,

    addOns: selectedAddOns,
  });

  order.pricing = {
    ...pricing,

    discountAmount: 0,

    discountPercentage: 0,

    finalAmount: pricing.calculatedAmount,

    amountInSubunits: pricing.amountInSubunits,

    priceVersion: (order.pricing.priceVersion || 1) + 1,

    priceEditedBy: null,

    priceEditedAt: null,

    discountReason: "",
  };

  order.addOns = pricing.addOns;

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

      amountInSubunits: order.pricing.amountInSubunits,

      currency: order.pricing.currency,
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
// GET ALL STUDENT ORDERS
// ============================================================

const findStudentOrders = async (studentId) => {
  return await orderRepository.findOrdersByStudentId(studentId);
};

// ============================================================
// ADMIN / SALES AGENT PRICE UPDATE
// ============================================================
//
// Exactly one of:
//
// - discountAmount
// - discountPercentage
// - finalAmount
//
// can be supplied.
//
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

  // ----------------------------------------------------------
  // Discount amount
  // ----------------------------------------------------------

  if (discountAmount !== undefined) {
    if (discountAmount < 0 || discountAmount > calculatedAmount) {
      throw new ApiError(400, "Invalid discount amount");
    }

    newDiscountAmount = Number(discountAmount.toFixed(2));

    newFinalAmount = Number((calculatedAmount - newDiscountAmount).toFixed(2));

    newDiscountPercentage =
      calculatedAmount === 0
        ? 0
        : Number(((newDiscountAmount / calculatedAmount) * 100).toFixed(2));
  }

  // ----------------------------------------------------------
  // Discount percentage
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // Final amount
  // ----------------------------------------------------------

  if (finalAmount !== undefined) {
    if (finalAmount < 0 || finalAmount > calculatedAmount) {
      throw new ApiError(400, "Final amount cannot exceed calculated price");
    }

    newFinalAmount = Number(finalAmount.toFixed(2));

    newDiscountAmount = Number((calculatedAmount - newFinalAmount).toFixed(2));

    newDiscountPercentage =
      calculatedAmount === 0
        ? 0
        : Number(((newDiscountAmount / calculatedAmount) * 100).toFixed(2));
  }

  // ----------------------------------------------------------
  // Update pricing
  // ----------------------------------------------------------

  order.pricing.discountAmount = newDiscountAmount;

  order.pricing.discountPercentage = newDiscountPercentage;

  order.pricing.finalAmount = newFinalAmount;

  // IMPORTANT:
  //
  // Stripe needs subunits.
  //
  // Example:
  //
  // $69.55 -> 6955
  //
  order.pricing.amountInSubunits = toSubunit(
    newFinalAmount,
    order.pricing.subunitFactor,
  );

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

      amountInSubunits: order.pricing.amountInSubunits,

      currency: order.pricing.currency,

      reason: discountReason || null,
    },
  });

  return order;
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createOrder,

  updateOrder,

  confirmOrder,

  getStudentOrder,

  findStudentOrders,

  updatePrice,
};
