const stripeProvider = require("./stripe.provider");

const providers = {
  stripe: stripeProvider,

  // Later:
  //
  // paypal:
  //     require("./paypal.provider"),
  //
  // authorizeNet:
  //     require("./authorizeNet.provider")
};

const getPaymentProvider = (paymentMethod) => {
  const provider = providers[paymentMethod];

  if (!provider) {
    throw new Error(`Unsupported payment method: ${paymentMethod}`);
  }

  return provider;
};

module.exports = getPaymentProvider;
