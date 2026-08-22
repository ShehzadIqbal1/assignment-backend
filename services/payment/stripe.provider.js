const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ============================================================
// CREATE PAYMENT INTENT
// ============================================================

const createPaymentIntent = async ({
  amount,
  currency,
  orderId,
  customerEmail,
  idempotencyKey,
}) => {
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: Math.round(amount * 100),

      currency,

      automatic_payment_methods: {
        enabled: true,
      },

      receipt_email: customerEmail,

      description: `Assignment Mavens Order ${orderId}`,

      metadata: {
        orderId: orderId.toString(),
      },
    },

    {
      idempotencyKey,
    },
  );

  return paymentIntent;
};

// ============================================================
// UPDATE PAYMENT INTENT AMOUNT
// ============================================================

const updatePaymentIntent = async ({ paymentIntentId, amount }) => {
  return stripe.paymentIntents.update(paymentIntentId, {
    amount: Math.round(amount * 100),
  });
};

// ============================================================
// RETRIEVE
// ============================================================

const retrievePaymentIntent = async (paymentIntentId) => {
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

// ============================================================
// CANCEL
// ============================================================

const cancelPaymentIntent = async (paymentIntentId) => {
  return stripe.paymentIntents.cancel(paymentIntentId);
};

// ============================================================
// WEBHOOK
// ============================================================

const constructWebhookEvent = (rawBody, signature, webhookSecret) => {
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
};

module.exports = {
  createPaymentIntent,
  updatePaymentIntent,
  retrievePaymentIntent,
  cancelPaymentIntent,
  constructWebhookEvent,
};
