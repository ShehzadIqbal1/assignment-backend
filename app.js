const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const contactRoutes = require("./routes/contact.routes");
const adminRoutes = require("./routes/admin.routes");
const routeConfigRoutes = require("./routes/routeConfig.routes");
const publicRoutes = require("./routes/public.routes");
const paymentController = require("./controllers/payment.controller");
const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");
const app = express();

// ============================================================
// SECURITY
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// ============================================================
// CORS
// ============================================================

const allowedOrigins = (process.env.CLIENT_URLS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },

    credentials: true,
  }),
);
// ============================================================
// STRIPE WEBHOOK
//
// IMPORTANT:
// This MUST come before express.json()
// because Stripe signature verification
// requires the raw request body.
// ============================================================

app.post(
  "/api/v1/payments/stripe/webhook",

  express.raw({
    type: "application/json",
  }),

  paymentController.stripeWebhook,
);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

// ============================================================
// LOGGER
// ============================================================

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ============================================================
// HEALTH
// ============================================================

app.get("/health/ready", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;

    /*
      Mongoose states:
      0 = disconnected
      1 = connected
      2 = connecting
      3 = disconnecting
    */

    if (dbState !== 1) {
      return res.status(503).json({
        status: "error",

        checks: {
          database: "unhealthy",
        },
      });
    }

    return res.status(200).json({
      status: "ok",

      checks: {
        database: "healthy",
      },
    });
  } catch (error) {
    return res.status(503).json({
      status: "error",

      checks: {
        database: "unhealthy",
      },

      error: error.message,
    });
  }
});

// ============================================================
// AUTH
// ============================================================

app.use("/api/v1/auth", authRoutes);

// ============================================================
// ORDERS
// ============================================================

app.use("/api/v1/orders", orderRoutes);

// ============================================================
// PAYMENTS
// ============================================================

app.use("/api/v1/payments", paymentRoutes);

app.use("/api/v1/contact", contactRoutes);

// ============================================================
// PANEL (admin / sales / writer / writer manager) — same User login, role-filtered
// ============================================================

app.use("/api/v1/admin", adminRoutes);

// ============================================================
// ROUTE CONFIGURATION - ADMIN
// ============================================================

app.use("/api/v1/admin/route-configs", routeConfigRoutes);

// ============================================================
// PUBLIC SITE CONFIGURATION
// ============================================================

app.use("/api/v1/public", publicRoutes);

// ============================================================
// 404
// ============================================================

app.use(notFound);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(errorHandler);

module.exports = app;
