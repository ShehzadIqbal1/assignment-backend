const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      required: true,
      enum: ["stripe"],
    },

    providerPaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "usd",
    },

    status: {
      type: String,
      enum: [
        "requiresPaymentMethod",
        "requiresAction",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "refunded",
      ],
      required: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);

paymentSchema.index(
  {
    orderId: 1,
    provider: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Payment", paymentSchema);
