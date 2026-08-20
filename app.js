const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");

const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
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
// HEALTH CHECK
// ============================================================

app.get("/api/v1/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Assignment Mavens API is running",
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/v1/auth", authRoutes);

// ============================================================
// 404 HANDLER
// ============================================================

app.use(notFound);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(errorHandler);

module.exports = app;
