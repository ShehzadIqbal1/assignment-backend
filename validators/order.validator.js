const {
  body,
  param,
} = require("express-validator");

// ============================================================
// CREATE ORDER
// ============================================================

const createOrderValidator = [
  body("assignmentType")
    .trim()
    .notEmpty()
    .withMessage(
      "Assignment type is required",
    ),

  body("academicLevel")
    .trim()
    .notEmpty()
    .withMessage(
      "Academic level is required",
    ),

  body("subject")
    .trim()
    .notEmpty()
    .withMessage(
      "Subject is required",
    ),

  body("title")
    .trim()
    .notEmpty()
    .withMessage(
      "Project title is required",
    )
    .isLength({
      max: 500,
    })
    .withMessage(
      "Project title cannot exceed 500 characters",
    ),

  // ----------------------------------------------------------
  // WEBSITE TAG
  // ----------------------------------------------------------

  body("tag")
    .trim()
    .notEmpty()
    .withMessage(
      "Website tag is required",
    )
    .isLength({
      max: 100,
    })
    .withMessage(
      "Tag cannot exceed 100 characters",
    ),

  // ----------------------------------------------------------
  // DEADLINE
  // ----------------------------------------------------------

  body("deadline")
    .trim()
    .notEmpty()
    .withMessage(
      "Deadline is required",
    ),

  // ----------------------------------------------------------
  // PAGES
  // ----------------------------------------------------------

  body("numberOfPages")
    .isInt({
      min: 1,
    })
    .withMessage(
      "Number of pages must be at least 1",
    ),

  // ----------------------------------------------------------
  // WORD COUNT
  // ----------------------------------------------------------

  body("wordCount")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage(
      "Word count cannot be negative",
    ),

  // ----------------------------------------------------------
  // LINE SPACING
  // ----------------------------------------------------------

  body("lineSpacing")
    .isIn([
      "single",
      "double",
    ])
    .withMessage(
      "Line spacing must be single or double",
    ),

  // ----------------------------------------------------------
  // REFERENCES
  // ----------------------------------------------------------

  body("references")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage(
      "References cannot be negative",
    ),

  // ----------------------------------------------------------
  // ADD-ONS
  //
  // OPTIONAL.
  //
  // Valid:
  //
  // addOns: []
  //
  // or:
  //
  // addOns: [
  //   "Grammar Check Report"
  // ]
  //
  // ----------------------------------------------------------

  body("addOns")
    .optional()
    .isArray()
    .withMessage(
      "Add-ons must be an array",
    ),

  body("addOns.*")
    .isString()
    .trim()
    .notEmpty()
    .withMessage(
      "Each add-on must be a valid name",
    ),
];

// ============================================================
// ORDER ID
// ============================================================

const orderIdValidator = [
  param("orderId")
    .isMongoId()
    .withMessage(
      "Invalid order ID",
    ),
];

// ============================================================
// STUDENT PRICING UPDATE
// ============================================================
//
// Student can update:
//Complete order inputs 
// Backend recalculates price.
//
// ============================================================

const updateOrderValidator = [
  ...orderIdValidator,

  body("assignmentType")
    .optional()
    .trim()
    .notEmpty(),

  body("academicLevel")
    .optional()
    .trim()
    .notEmpty(),

  body("subject")
    .optional()
    .trim()
    .notEmpty(),

  body("title")
    .optional()
    .trim()
    .isLength({
      max:500
    }),

  body("deadline")
    .optional()
    .trim()
    .notEmpty(),

  body("numberOfPages")
    .optional()
    .isInt({
      min:1
    }),

  body("wordCount")
    .optional()
    .isInt({
      min:0
    }),

  body("lineSpacing")
    .optional()
    .isIn([
      "single",
      "double"
    ]),

  body("guidelines")
    .optional()
    .trim(),

  body("citationStyle")
    .optional()
    .trim(),

  body("references")
    .optional()
    .isInt({
      min:0
    }),

  body("fontStyle")
    .optional()
    .trim(),

  body("language")
    .optional()
    .trim(),

  body("addOns")
    .optional()
    .isArray(),

  body("addOns.*")
    .optional()
    .isString()
    .trim()
];


module.exports = {
 updateOrderValidator
};

// ============================================================
// ADMIN / SALES AGENT PRICE UPDATE
// ============================================================
//
// Exactly ONE:
//
// - discountAmount
// - discountPercentage
// - finalAmount
//
// ============================================================

const updatePriceValidator = [
  ...orderIdValidator,

  body("discountAmount")
    .optional()
    .isFloat({
      min: 0,
    })
    .withMessage(
      "Discount amount cannot be negative",
    ),

  body("discountPercentage")
    .optional()
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage(
      "Discount percentage must be between 0 and 100",
    ),

  body("finalAmount")
    .optional()
    .isFloat({
      min: 0,
    })
    .withMessage(
      "Final amount cannot be negative",
    ),

  body("discountReason")
    .optional()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Discount reason cannot exceed 500 characters",
    ),
];

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createOrderValidator,

  orderIdValidator,

  updateOrderValidator,

  updatePriceValidator,
};