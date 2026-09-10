const userRepository = require("../repositories/user.repository");

const ROLES = require("../constants/roles");

const ApiError = require("../utils/ApiError");

const { generateToken } = require("../utils/token");

// ============================================================
// BUILD USER RESPONSE
// ============================================================

const buildUserResponse = (user) => {
  return {
    id: user._id,

    fullName: user.fullName,

    email: user.email,

    countryCode: user.countryCode,

    phoneNumber: user.phoneNumber,

    tag: user.tag,

    role: user.role,

    isActive: user.isActive,

    emailVerified: user.emailVerified,

    createdAt: user.createdAt,
  };
};

// ============================================================
// SIGNUP
// ============================================================

const signup = async ({
  fullName,
  email,
  countryCode,
  phoneNumber,
  password,
  tag,
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  const normalizedTag = tag.trim().toLowerCase();

  const existingUser = await userRepository.findByEmail(normalizedEmail);

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  let user;

  try {
    user = await userRepository.createUser({
      fullName,

      email: normalizedEmail,

      countryCode,

      phoneNumber,

      // Saving plain password
      password,

      tag: normalizedTag,

      role: ROLES.STUDENT,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Email is already registered");
    }

    throw error;
  }

  const token = generateToken(user);

  return {
    token,

    user: buildUserResponse(user),
  };
};

// ============================================================
// LOGIN
// ============================================================

const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await userRepository.findByEmail(normalizedEmail, true);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  // Direct string comparison
  if (user.password !== password) {
    throw new ApiError(401, "Invalid email or password");
  }

  user.lastLoginAt = new Date();

  await user.save();

  const token = generateToken(user);

  return {
    token,

    user: buildUserResponse(user),
  };
};

// ============================================================
// CURRENT USER
// ============================================================

const getCurrentUser = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return buildUserResponse(user);
};

// ============================================================
// CHECK EMAIL
// ============================================================

const checkEmailAvailability = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await userRepository.findByEmail(normalizedEmail);

  return {
    email: normalizedEmail,

    available: !user,
  };
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  signup,
  login,
  getCurrentUser,
  checkEmailAvailability,
};
