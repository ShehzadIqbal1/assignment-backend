const crypto = require("crypto");

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);

  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `AMVOC-${timestamp}-${random}`;
};

module.exports = generateOrderNumber;
