const { body, param, query } = require("express-validator");

const ROLES = require("../constants/roles");
const ORDER_STATUS = require("../constants/orderStatus");

const createStaffValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 }),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("countryCode")
    .trim()
    .notEmpty()
    .withMessage("Country code is required")
    .matches(/^\+\d{1,4}$/)
    .withMessage("Invalid country code"),

  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\d{6,20}$/)
    .withMessage("Please provide a valid phone number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn([ROLES.SALES_AGENT, ROLES.WRITER, ROLES.WRITER_MANAGER])
    .withMessage("Role must be salesAgent, writer, or writerManager"),
];

const userIdValidator = [
  param("userId").isMongoId().withMessage("Invalid user ID"),
];

const updateStaffStatusValidator = [
  ...userIdValidator,
  body("isActive").isBoolean().withMessage("isActive must be a boolean"),
];

const updateStaffRoleValidator = [
  ...userIdValidator,
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn([ROLES.SALES_AGENT, ROLES.WRITER, ROLES.WRITER_MANAGER])
    .withMessage("Role must be salesAgent, writer, or writerManager"),
];

const orderIdValidator = [
  param("orderId").isMongoId().withMessage("Invalid order ID"),
];

const assignWriterValidator = [
  ...orderIdValidator,
  body("writerId").isMongoId().withMessage("Invalid writer ID"),
];

const updateStatusValidator = [
  ...orderIdValidator,
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(Object.values(ORDER_STATUS))
    .withMessage("Invalid order status"),
];

const listOrdersQueryValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("status").optional().isIn(Object.values(ORDER_STATUS)),
  query("paymentStatus")
    .optional()
    .isIn(["pending", "processing", "paid", "failed", "refunded"]),
  query("tag").optional().trim().isLength({ max: 100 }),
  query("search").optional().trim().isLength({ max: 200 }),
];

//
const createStudentValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 }),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("countryCode")
    .trim()
    .notEmpty()
    .withMessage("Country code is required")
    .matches(/^\+\d{1,4}$/)
    .withMessage("Invalid country code"),

  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\d{6,20}$/)
    .withMessage("Please provide a valid phone number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters"),

  body("tag")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["tutorspath", "tutorsnext"])
    .withMessage("Tag must be tutorspath or tutorsnext"),
];

const updateStudentValidator = [
  ...userIdValidator,

  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .isLength({ min: 2, max: 100 }),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("countryCode")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Country code cannot be empty")
    .matches(/^\+\d{1,4}$/)
    .withMessage("Invalid country code"),

  body("phoneNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .matches(/^\d{6,20}$/)
    .withMessage("Please provide a valid phone number"),

  body("password")
    .optional({ values: "falsy" })
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters"),

  body("tag")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["tutorspath", "tutorsnext"])
    .withMessage("Tag must be tutorspath or tutorsnext"),
];

const updateStudentStatusValidator = [
  ...userIdValidator,
  body("isActive").isBoolean().withMessage("isActive must be a boolean"),
];

module.exports = {
  createStaffValidator,
  updateStaffStatusValidator,
  updateStaffRoleValidator,
  orderIdValidator,
  assignWriterValidator,
  updateStatusValidator,
  listOrdersQueryValidator,
  createStudentValidator,
  userIdValidator,
  updateStudentValidator,
  updateStudentStatusValidator,
};
