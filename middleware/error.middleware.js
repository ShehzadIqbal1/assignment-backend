const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode || 500;

  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    statusCode = 422;
  }

  if (err.name === "CastError") {
    statusCode = 400;

    message = "Invalid resource identifier";
  }

  if (err.code === 11000) {
    statusCode = 409;

    message = "A record with the provided value already exists";
  }

  return res.status(statusCode).json({
    success: false,

    message,

    ...(process.env.NODE_ENV !== "production"
      ? {
          error: err.name,
        }
      : {}),
  });
};

module.exports = errorHandler;
