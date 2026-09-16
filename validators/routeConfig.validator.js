const { body, query } = require("express-validator");

// ============================================================
// ADMIN UPSERT
// ============================================================

const upsertRouteValidator = [
  body("siteTag")
    .trim()
    .notEmpty()
    .withMessage("Site tag is required")
    .isLength({
      max: 100,
    })
    .withMessage("Site tag cannot exceed 100 characters"),

  body("path")
    .trim()
    .notEmpty()
    .withMessage("Path is required")
    .isLength({
      max: 500,
    })
    .withMessage("Path cannot exceed 500 characters"),

  body("isRealHomePage")
    .isBoolean()
    .withMessage("isRealHomePage must be a boolean"),
];

// ============================================================
// ADMIN DELETE
// ============================================================

const deleteRouteValidator = [
  query("siteTag").trim().notEmpty().withMessage("Site tag is required"),

  query("path").trim().notEmpty().withMessage("Path is required"),
];

// ============================================================
// ADMIN LIST
// ============================================================

const listRoutesValidator = [
  query("siteTag").trim().notEmpty().withMessage("Site tag is required"),
];

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  upsertRouteValidator,
  deleteRouteValidator,
  listRoutesValidator,
};
