const User = require("../models/User");

const findByEmail = async (email, includePassword = false) => {
  let query = User.findOne({
    email: email.toLowerCase(),
  });

  if (includePassword) {
    query = query.select("+password");
  }

  return query;
};

const findById = async (userId) => {
  return User.findById(userId);
};

const createUser = async (userData) => {
  return User.create(userData);
};

module.exports = {
  findByEmail,
  findById,
  createUser,
};
