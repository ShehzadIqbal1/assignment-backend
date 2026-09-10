const Payment = require("../models/Payment");

const findByOrder = async (orderId) => {
  return Payment.findOne({
    orderId,
  });
};

const createPayment = async (data) => {
  return Payment.create(data);
};

const updatePayment = async (paymentId, updates) => {
  return Payment.findByIdAndUpdate(paymentId, updates, {
    new: true,
    runValidators: true,
  });
};

const findByProviderPaymentId = async (providerPaymentId) => {
  return Payment.findOne({
    providerPaymentId,
  });
};

module.exports = {
  findByOrder,
  createPayment,
  updatePayment,
  findByProviderPaymentId,
};
