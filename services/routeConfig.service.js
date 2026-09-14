const RouteConfig = require("../models/RouteConfig");

const ApiError = require("../utils/ApiError");

// ============================================================
// CACHE
// ============================================================
//
// Cache active routes per site.
//
// Example:
//
// tutorspath =>
// {
//   routes: ["/", "/essay"],
//   expiresAt: 123456789
// }
//
// ============================================================

const activeRoutesCache = new Map();

// 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

// ============================================================
// HELPERS
// ============================================================

const normalizeSiteTag = (siteTag) => {
  if (!siteTag || typeof siteTag !== "string") {
    throw new ApiError(400, "Site tag is required");
  }

  return siteTag.trim().toLowerCase();
};

const normalizePath = (value) => {
  if (!value || typeof value !== "string") {
    throw new ApiError(400, "Path is required");
  }

  let path = value.trim();

  path = path.split("?")[0].split("#")[0];

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  path = path.replace(/\/+/g, "/");

  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  return path || "/";
};

// ============================================================
// CACHE INVALIDATION
// ============================================================

const invalidateSiteCache = (siteTag) => {
  const normalizedTag = normalizeSiteTag(siteTag);

  activeRoutesCache.delete(normalizedTag);
};

// ============================================================
// UPSERT ROUTE
// ============================================================

const upsertRouteConfig = async ({ siteTag, path, isRealHomePage }) => {
  const normalizedTag = normalizeSiteTag(siteTag);
  const normalizedPath = normalizePath(path);

  if (typeof isRealHomePage !== "boolean") {
    throw new ApiError(400, "isRealHomePage must be a boolean");
  }

  const routeConfig = await RouteConfig.findOneAndUpdate(
    {
      siteTag: normalizedTag,
      path: normalizedPath,
    },

    {
      $set: {
        isRealHomePage,
      },
    },

    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  invalidateSiteCache(normalizedTag);

  return routeConfig;
};

// ============================================================
// DELETE ROUTE
// ============================================================

const deleteRouteConfig = async ({ siteTag, path }) => {
  const normalizedTag = normalizeSiteTag(siteTag);
  const normalizedPath = normalizePath(path);

  const deleted = await RouteConfig.findOneAndDelete({
    siteTag: normalizedTag,
    path: normalizedPath,
  });

  if (!deleted) {
    throw new ApiError(404, "Route configuration not found");
  }

  invalidateSiteCache(normalizedTag);

  return deleted;
};

// ============================================================
// LIST ALL CONFIGURED ROUTES FOR ADMIN
// ============================================================

const listRouteConfigs = async (siteTag) => {
  const normalizedTag = normalizeSiteTag(siteTag);

  return RouteConfig.find({
    siteTag: normalizedTag,
  }).sort({
    path: 1,
  });
};

// ============================================================
// GET ACTIVE ROUTES FOR PUBLIC FRONTEND
// ============================================================

const getActiveRoutes = async (siteTag) => {
  const normalizedTag = normalizeSiteTag(siteTag);

  const cached = activeRoutesCache.get(normalizedTag);

  // Return valid cache
  if (cached && cached.expiresAt > Date.now()) {
    return cached.routes;
  }

  const configs = await RouteConfig.find({
    siteTag: normalizedTag,
    isRealHomePage: true,
  })
    .select("path -_id")
    .sort({
      path: 1,
    })
    .lean();

  const routes = configs.map((item) => item.path);

  activeRoutesCache.set(normalizedTag, {
    routes,

    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return routes;
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  upsertRouteConfig,
  deleteRouteConfig,
  listRouteConfigs,
  getActiveRoutes,
  invalidateSiteCache,
};
