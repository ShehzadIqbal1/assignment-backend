const { body, param } = require("express-validator");

// ============================================================
// CREATE ORDER
// ============================================================

const createOrderValidator = [
  body("assignmentType")
    .trim()
    .notEmpty()
    .withMessage("Assignment type is required"),

  body("academicLevel")
    .trim()
    .notEmpty()
    .withMessage("Academic level is required"),

  body("subject").trim().notEmpty().withMessage("Subject is required"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Project title is required")
    .isLength({
      max: 500,
    })
    .withMessage("Project title cannot exceed 500 characters"),

  body("tag")
    .trim()
    .notEmpty()
    .withMessage("Website tag is required")
    .isLength({
      max: 100,
    })
    .withMessage("Tag cannot exceed 100 characters"),

  body("deadline").trim().notEmpty().withMessage("Deadline is required"),

  body("numberOfPages")
    .isInt({
      min: 1,
    })
    .withMessage("Number of pages must be at least 1"),

  body("wordCount")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage("Word count cannot be negative"),

  body("lineSpacing")
    .isIn(["single", "double"])
    .withMessage("Line spacing must be single or double"),

  body("references")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage("References cannot be negative"),
];

// ============================================================
// ORDER ID
// ============================================================

const orderIdValidator = [
  param("orderId").isMongoId().withMessage("Invalid order ID"),
];

// ============================================================
// STUDENT PRICING UPDATE
//
// Student can change:
// - deadline
// - number of pages
// - line spacing
//
// Backend recalculates the price.
// ============================================================

const updateOrderPricingValidator = [
  ...orderIdValidator,

  body("deadline")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Deadline cannot be empty"),

  body("numberOfPages")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage("Number of pages must be at least 1"),

  body("lineSpacing")
    .optional()
    .isIn(["single", "double"])
    .withMessage("Line spacing must be single or double"),
];

// ============================================================
// ADMIN / SALES AGENT PRICE UPDATE
//
// Exactly ONE of these should be supplied:
// - discountAmount
// - discountPercentage
// - finalAmount
// ============================================================

const updatePriceValidator = [
  ...orderIdValidator,

  body("discountAmount")
    .optional()
    .isFloat({
      min: 0,
    })
    .withMessage("Discount amount cannot be negative"),

  body("discountPercentage")
    .optional()
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage("Discount percentage must be between 0 and 100"),

  body("finalAmount")
    .optional()
    .isFloat({
      min: 0,
    })
    .withMessage("Final amount cannot be negative"),

  body("discountReason")
    .optional()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage("Discount reason cannot exceed 500 characters"),
];

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createOrderValidator,
  orderIdValidator,
  updateOrderPricingValidator,
  updatePriceValidator,
};
