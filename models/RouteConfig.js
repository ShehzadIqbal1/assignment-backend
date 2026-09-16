const mongoose = require("mongoose");

// ============================================================
// NORMALIZE PATH
// ============================================================

const normalizePath = (value) => {
  if (!value || typeof value !== "string") {
    return "/";
  }

  let path = value.trim();

  // Remove query string/hash if accidentally provided
  path = path.split("?")[0].split("#")[0];

  // Ensure leading slash
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  // Collapse duplicate slashes
  path = path.replace(/\/+/g, "/");

  // Remove trailing slash except root
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  return path || "/";
};

// ============================================================
// SCHEMA
// ============================================================

const routeConfigSchema = new mongoose.Schema(
  {
    siteTag: {
      type: String,
      required: [true, "Site tag is required"],
      trim: true,
      lowercase: true,
      index: true,
    },

    path: {
      type: String,
      required: [true, "Path is required"],
      trim: true,
      set: normalizePath,
    },

    isRealHomePage: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================
// UNIQUE ROUTE PER WEBSITE
// ============================================================

routeConfigSchema.index(
  {
    siteTag: 1,
    path: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("RouteConfig", routeConfigSchema);
module.exports.normalizePath = normalizePath;
