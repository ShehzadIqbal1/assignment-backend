const Order = require("../models/Order");

const createOrder = async (data) => {
  return Order.create(data);
};

const findById = async (orderId) => {
  return Order.findById(orderId);
};

const findStudentOrder = async (orderId, studentId) => {
  return await Order.findOne({
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

const findOrdersByStudentId = async (studentId) => {

    return Order.find({
        studentId
    })
    .sort({
        createdAt:-1
    });

};

module.exports = {
  createOrder,
  findById,
  findStudentOrder,
  updateOrder,
  findOrdersByStudentId,
};
