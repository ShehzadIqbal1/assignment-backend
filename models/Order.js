const mongoose = require("mongoose");

const ORDER_STATUS = require("../constants/orderStatus");

const orderSchema = new mongoose.Schema(
  {
    // ====================================================
    // ORDER IDENTIFICATION
    // ====================================================

    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // ====================================================
    // OWNER
    // ====================================================

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ====================================================
    // ORDER DETAILS
    // ====================================================

    assignmentType: {
      type: String,
      required: true,
      trim: true,
    },

    academicLevel: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    deadline: {
      type: String,
      required: true,
      trim: true,
    },

    numberOfPages: {
      type: Number,
      required: true,
      min: 1,
    },

    wordCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    lineSpacing: {
      type: String,
      enum: ["single", "double"],
      required: true,
    },

    guidelines: {
      type: String,
      trim: true,
      maxlength: 10000,
    },

    citationStyle: {
      type: String,
      trim: true,
    },

    references: {
      type: Number,
      min: 0,
      default: 0,
    },

    fontStyle: {
      type: String,
      trim: true,
    },

    language: {
      type: String,
      trim: true,
    },

    // ====================================================
    // PRICING
    // ====================================================

    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },

      lineSpacingMultiplier: {
        type: Number,
        required: true,
        min: 1,
      },

      calculatedAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      discountAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      finalAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        default: "usd",
      },

      priceVersion: {
        type: Number,
        default: 1,
      },

      priceEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      priceEditedAt: {
        type: Date,
        default: null,
      },

      discountReason: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },
    },

    // ====================================================
    // PAYMENT
    // ====================================================

    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      default: null,
    },

    // ====================================================
    // WORKFLOW
    // ====================================================

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.DRAFT,
      index: true,
    },

    // ====================================================
    // WRITER
    // ====================================================

    currentWriterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ====================================================
    // COMPLETION
    // ====================================================

    completedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);

// ============================================================
// INDEXES
// ============================================================

orderSchema.index({
  studentId: 1,
  createdAt: -1,
});

orderSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Order", orderSchema);
