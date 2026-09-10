const mongoose = require("mongoose");

const ROLES = require("../constants/roles");

const userSchema = new mongoose.Schema(
  {
    // ====================================================
    // USER DETAILS
    // ====================================================

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    countryCode: {
      type: String,
      required: [true, "Country code is required"],
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    // ====================================================
    // WEBSITE SOURCE
    // ====================================================
    //
    // Example:
    // tutorspath
    // tutorsnext
    //
    // This identifies which website the student
    // registered from.
    //
    // ====================================================

    tag: {
      type: String,
      required: [true, "Website tag is required"],
      trim: true,
      lowercase: true,
      maxlength: 100,
      index: true,
    },

    // ====================================================
    // ROLE
    // ====================================================

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
      index: true,
    },

    // ====================================================
    // ACCOUNT STATUS
    // ====================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
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

userSchema.index({
  tag: 1,
  createdAt: -1,
});

module.exports = mongoose.model("User", userSchema);