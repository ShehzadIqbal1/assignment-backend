const { verifyToken } = require("../utils/token");

const ApiError = require("../utils/ApiError");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new ApiError(401, "Authentication required"));
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Invalid authorization header"));
  }

  try {
    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,

      role: decoded.role,
    };

    next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

module.exports = authenticate;
