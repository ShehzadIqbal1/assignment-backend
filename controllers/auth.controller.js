const authService = require("../services/auth.service");

const asyncHandler = require("../utils/asyncHandler");

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);

  return res.status(201).json({
    success: true,

    message: "Account created successfully",

    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  return res.status(200).json({
    success: true,

    message: "Login successful",

    data: result,
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.userId);

  return res.status(200).json({
    success: true,

    data: {
      user,
    },
  });
});

const checkEmail = asyncHandler(async (req, res) => {
  const result = await authService.checkEmailAvailability(req.query.email);

  return res.status(200).json({
    success: true,

    data: result,
  });
});

module.exports = {
  signup,
  login,
  me,
  checkEmail,
};
