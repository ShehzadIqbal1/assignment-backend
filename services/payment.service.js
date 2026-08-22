const User = require("../models/User");

const Order = require("../models/Order");

const Payment = require("../models/Payment");

const OrderEvent = require("../models/OrderEvent");

const getPaymentProvider = require("./payment/paymentProvider");

const ORDER_STATUS = require("../constants/orderStatus");

const ApiError = require("../utils/ApiError");

const generateOrderNumber = require("../utils/orderNumber");

// ============================================================
// CREATE / REUSE PAYMENT INTENT
// ============================================================

const createPaymentIntent = async ({
  orderId,
  studentId,
  paymentMethod = "stripe",
}) => {
  const order = await Order.findOne({
    _id: orderId,

    studentId,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== ORDER_STATUS.AWAITING_PAYMENT) {
    throw new ApiError(400, "This order is not ready for payment");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "This order has already been paid");
  }

  if (order.pricing.finalAmount <= 0) {
    throw new ApiError(400, "Order amount must be greater than zero");
  }

  const user = await User.findById(studentId);

  if (!user) {
    throw new ApiError(404, "Student not found");
  }

  const provider = getPaymentProvider(paymentMethod);

  let payment = await Payment.findOne({
    orderId,
    provider: paymentMethod,
  });

  // ========================================================
  // EXISTING PAYMENT INTENT
  // ========================================================

  if (payment) {
    const existingIntent = await provider.retrievePaymentIntent(
      payment.providerPaymentId,
    );

    if (existingIntent.status === "succeeded") {
      throw new ApiError(400, "Payment has already succeeded");
    }

    // ----------------------------------------------------
    // Amount changed because admin/sales edited price
    // ----------------------------------------------------

    if (existingIntent.amount !== Math.round(order.pricing.finalAmount * 100)) {
      const updateableStatuses = [
        "requires_payment_method",

        "requires_confirmation",

        "requires_action",
      ];

      if (!updateableStatuses.includes(existingIntent.status)) {
        /*
         * We don't modify an intent that is already
         * processing. The safer approach is to let
         * that payment finish before changing price.
         */

        throw new ApiError(
          409,
          "Existing Stripe payment is already processing",
        );
      }

      const updatedIntent = await provider.updatePaymentIntent({
        paymentIntentId: existingIntent.id,

        amount: order.pricing.finalAmount,
      });

      payment.amount = order.pricing.finalAmount;

      payment.status = mapStripeStatus(updatedIntent.status);

      await payment.save();

      return {
        paymentMethod,

        paymentIntentId: updatedIntent.id,

        clientSecret: updatedIntent.client_secret,

        amount: order.pricing.finalAmount,

        currency: order.pricing.currency,
      };
    }

    return {
      paymentMethod,

      paymentIntentId: existingIntent.id,

      clientSecret: existingIntent.client_secret,

      amount: order.pricing.finalAmount,

      currency: order.pricing.currency,
    };
  }

  // ========================================================
  // CREATE NEW PAYMENT INTENT
  // ========================================================

  const idempotencyKey = `order-${order._id.toString()}-price-${order.pricing.priceVersion}`;

  const paymentIntent = await provider.createPaymentIntent({
    amount: order.pricing.finalAmount,

    currency: order.pricing.currency,

    orderId: order._id,

    customerEmail: user.email,

    idempotencyKey,
  });

  payment = await Payment.create({
    orderId: order._id,

    studentId,

    provider: paymentMethod,

    providerPaymentId: paymentIntent.id,

    amount: order.pricing.finalAmount,

    currency: order.pricing.currency,

    status: mapStripeStatus(paymentIntent.status),
  });

  order.paymentMethod = paymentMethod;

  order.paymentStatus = "pending";

  await order.save();

  await OrderEvent.create({
    orderId: order._id,

    userId: studentId,

    role: "student",

    action: "paymentIntentCreated",

    metadata: {
      provider: paymentMethod,

      paymentIntentId: paymentIntent.id,

      amount: order.pricing.finalAmount,
    },
  });

  return {
    paymentMethod,

    paymentIntentId: paymentIntent.id,

    clientSecret: paymentIntent.client_secret,

    amount: order.pricing.finalAmount,

    currency: order.pricing.currency,
  };
};

// ============================================================
// STRIPE WEBHOOK
// ============================================================

const handleStripeWebhook = async (rawBody, signature) => {
  const provider = getPaymentProvider("stripe");

  const event = provider.constructWebhookEvent(
    rawBody,

    signature,

    process.env.STRIPE_WEBHOOK_SECRET,
  );

  // ----------------------------------------------------
  // Payment succeeded
  // ----------------------------------------------------

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    await markPaymentSuccessful(paymentIntent);
  }

  // ----------------------------------------------------
  // Payment failed
  // ----------------------------------------------------

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;

    await markPaymentFailed(paymentIntent);
  }

  return event;
};

// ============================================================
// SUCCESS
// ============================================================

const markPaymentSuccessful = async (paymentIntent) => {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    throw new Error("Stripe PaymentIntent missing orderId metadata");
  }

  const payment = await Payment.findOne({
    provider: "stripe",

    providerPaymentId: paymentIntent.id,
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  /*
   * Atomic update.
   *
   * If Stripe sends the same webhook twice,
   * only the first request can change the order
   * from unpaid -> paid.
   */

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,

      paymentStatus: {
        $ne: "paid",
      },
    },

    {
      $set: {
        paymentStatus: "paid",

        status: ORDER_STATUS.PAID,

        paymentMethod: "stripe",
      },
    },

    {
      new: true,
    },
  );

  // Duplicate webhook
  if (!order) {
    return;
  }

  // ----------------------------------------------------
  // Generate order number after successful payment
  // ----------------------------------------------------

  if (!order.orderNumber) {
    order.orderNumber = generateOrderNumber();

    await order.save();
  }

  payment.status = "succeeded";

  payment.amount = paymentIntent.amount / 100;

  payment.paidAt = new Date();

  await payment.save();

  await OrderEvent.create({
    orderId: order._id,

    userId: order.studentId,

    role: "system",

    action: "paymentSucceeded",

    fromStatus: ORDER_STATUS.AWAITING_PAYMENT,

    toStatus: ORDER_STATUS.PAID,

    metadata: {
      provider: "stripe",

      paymentIntentId: paymentIntent.id,

      amount: paymentIntent.amount / 100,
    },
  });
};

// ============================================================
// FAILURE
// ============================================================

const markPaymentFailed = async (paymentIntent) => {
  const payment = await Payment.findOne({
    provider: "stripe",

    providerPaymentId: paymentIntent.id,
  });

  if (!payment) {
    return;
  }

  payment.status = "failed";

  payment.failureReason =
    paymentIntent.last_payment_error?.message || "Payment failed";

  await payment.save();

  await Order.findByIdAndUpdate(
    payment.orderId,

    {
      $set: {
        paymentStatus: "failed",
      },
    },
  );

  await OrderEvent.create({
    orderId: payment.orderId,

    userId: payment.studentId,

    role: "system",

    action: "paymentFailed",

    metadata: {
      provider: "stripe",

      paymentIntentId: paymentIntent.id,

      reason: payment.failureReason,
    },
  });
};

// ============================================================
// STRIPE STATUS MAPPER
// ============================================================

const mapStripeStatus = (status) => {
  switch (status) {
    case "succeeded":
      return "succeeded";

    case "processing":
      return "processing";

    case "requires_action":
      return "requiresAction";

    case "canceled":
      return "cancelled";

    case "requires_payment_method":
      return "requiresPaymentMethod";

    default:
      return "requiresPaymentMethod";
  }
};

module.exports = {
  createPaymentIntent,
  handleStripeWebhook,
};
