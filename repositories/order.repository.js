const Order = require("../models/Order");

const createOrder = async (data) => {
  return Order.create(data);
};

const findById = async (orderId) => {
  return Order.findById(orderId);
};

const findStudentOrder = async (orderId, studentId) => {
  return Order.findOne({
    _id: orderId,

    studentId,
  });
};

const updateOrder = async (orderId, updates) => {
  return Order.findByIdAndUpdate(orderId, updates, {
    new: true,
    runValidators: true,
  });
};

module.exports = {
  createOrder,
  findById,
  findStudentOrder,
  updateOrder,
};
