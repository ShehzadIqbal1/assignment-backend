const bcrypt = require("bcryptjs");

const userRepository = require("../repositories/user.repository");

const ROLES = require("../constants/roles");

const ApiError = require("../utils/ApiError");

const { generateToken } = require("../utils/token");

const buildUserResponse = (user) => {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    countryCode: user.countryCode,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
};

const signup = async ({
  fullName,
  email,
  countryCode,
  phoneNumber,
  password,
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await userRepository.findByEmail(normalizedEmail);

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user;

  try {
    user = await userRepository.createUser({
      fullName,

      email: normalizedEmail,

      countryCode,

      phoneNumber,

      password: passwordHash,

      // IMPORTANT:
      // Public signup always creates
      // a student account.

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

const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await userRepository.findByEmail(normalizedEmail, true);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
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

const getCurrentUser = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return buildUserResponse(user);
};

const checkEmailAvailability = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await userRepository.findByEmail(normalizedEmail);

  return {
    email: normalizedEmail,

    available: !user,
  };
};

module.exports = {
  signup,

  login,

  getCurrentUser,

  checkEmailAvailability,
};
