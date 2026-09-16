const routeConfigService = require("../services/routeConfig.service");

const asyncHandler = require("../utils/asyncHandler");

// ============================================================
// ADMIN - CREATE / UPDATE ROUTE
// ============================================================

const upsertRoute = asyncHandler(async (req, res) => {
  const route = await routeConfigService.upsertRouteConfig({
    siteTag: req.body.siteTag,

    path: req.body.path,

    isRealHomePage: req.body.isRealHomePage,
  });

  return res.status(200).json({
    success: true,

    message: "Route configuration updated successfully",

    data: {
      route,
    },
  });
});

// ============================================================
// ADMIN - DELETE ROUTE
// ============================================================

const deleteRoute = asyncHandler(async (req, res) => {
  const route = await routeConfigService.deleteRouteConfig({
    siteTag: req.query.siteTag,

    path: req.query.path,
  });

  return res.status(200).json({
    success: true,

    message: "Route configuration deleted successfully",

    data: {
      route,
    },
  });
});

// ============================================================
// ADMIN - LIST ROUTES
// ============================================================

const listRoutes = asyncHandler(async (req, res) => {
  const routes = await routeConfigService.listRouteConfigs(req.query.siteTag);

  return res.status(200).json({
    success: true,

    data: {
      routes,
    },
  });
});

// ============================================================
// PUBLIC - ACTIVE ROUTES
// ============================================================

const getActiveRoutes = asyncHandler(async (req, res) => {
  const siteTag = req.headers["x-site-tag"] || req.query.siteTag;

  const routes = await routeConfigService.getActiveRoutes(siteTag);

  return res.status(200).json({
    success: true,

    data: {
      siteTag: String(siteTag).trim().toLowerCase(),

      activeRoutes: routes,
    },
  });
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  upsertRoute,
  deleteRoute,
  listRoutes,
  getActiveRoutes,
};
