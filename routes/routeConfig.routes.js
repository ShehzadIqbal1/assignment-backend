const express = require("express");

const authenticate = require("../middleware/auth.middleware");

const authorize = require("../middleware/role.middleware");

const validate = require("../middleware/validate.middleware");

const ROLES = require("../constants/roles");

const controller = require("../controllers/routeConfig.controller");

const {
  upsertRouteValidator,
  deleteRouteValidator,
  listRoutesValidator,
} = require("../validators/routeConfig.validator");

const router = express.Router();

// All routes below require authentication
router.use(authenticate);

// ============================================================
// CREATE / UPDATE ROUTE CONFIGURATION
// ============================================================

router.put(
  "/",
  authorize(ROLES.ADMIN),
  upsertRouteValidator,
  validate,
  controller.upsertRoute,
);

// ============================================================
// LIST SITE ROUTES
// ============================================================

router.get(
  "/",
  authorize(ROLES.ADMIN),
  listRoutesValidator,
  validate,
  controller.listRoutes,
);

// ============================================================
// DELETE ROUTE
// ============================================================

router.delete(
  "/",
  authorize(ROLES.ADMIN),
  deleteRouteValidator,
  validate,
  controller.deleteRoute,
);

module.exports = router;
