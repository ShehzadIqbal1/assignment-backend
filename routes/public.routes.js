const express = require("express");

const controller = require("../controllers/routeConfig.controller");

const router = express.Router();

// ============================================================
// ACTIVE REAL-HOMEPAGE ROUTES
// ============================================================

router.get("/active-routes", controller.getActiveRoutes);

module.exports = router;
