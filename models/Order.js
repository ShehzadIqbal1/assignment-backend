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

    // Website that created the order
    //
    // Example:
    // tutorspath
    // tutorsnext
    //
    tag: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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
      default: "",
    },

    citationStyle: {
      type: String,
      trim: true,
      default: "",
    },

    references: {
      type: Number,
      min: 0,
      default: 0,
    },

    fontStyle: {
      type: String,
      trim: true,
      default: "",
    },

    language: {
      type: String,
      trim: true,
      default: "",
    },

    // ====================================================
    // ADD-ONS
    // ====================================================
    //
    // Optional.
    //
    // If student selects nothing:
    //
    // addOns: []
    //
    // We store the price snapshot because the website's
    // pricing configuration could change later.
    //
    // ====================================================

    addOns: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },

          price: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],

      default: [],
    },

    // ====================================================
    // PRICING
    // ====================================================

    pricing: {
      // Price per page based on selected deadline
      rate: {
        type: Number,
        required: true,
        min: 0,
      },

      numberOfPages: {
        type: Number,
        required: true,
        min: 1,
      },

      lineSpacingMultiplier: {
        type: Number,
        required: true,
        min: 1,
      },

      // Deadline rate × spacing × pages
      assignmentAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      // Total price of selected add-ons
      addOnsAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      // Assignment + add-ons before discount
      calculatedAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      // Discount applied by admin/sales
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

      // Final customer-facing amount
      finalAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      // Amount sent to Stripe
      //
      // USD $15.70 = 1570
      //
      amountInSubunits: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      // Example:
      //
      // USD = 100
      // JPY = 1
      //
      subunitFactor: {
        type: Number,
        required: true,
        min: 1,
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
      enum: [
        "pending",
        "processing",
        "paid",
        "failed",
        "refunded",
      ],
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

orderSchema.index({
  tag: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Order",
  orderSchema,
);