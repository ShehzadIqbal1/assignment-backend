const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const siteRoutes = require("./routes/site.routes");
const contactRoutes =require("./routes/contact.routes");
const paymentController = require("./controllers/payment.controller");
const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");
const app = express();

// ============================================================
// SECURITY
// ============================================================

app.use(helmet());

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",

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

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,

    message: "Assignment backend API is running",
  });
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

// ============================================================
// SITE CONFIG
// ============================================================
app.use("/api/v1/site", siteRoutes);

app.use("/api/v1/contact",contactRoutes);

// ============================================================
// 404
// ============================================================

app.use(notFound);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(errorHandler);

module.exports = app;
