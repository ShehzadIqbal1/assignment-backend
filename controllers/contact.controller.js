const { sendContactEmail } = require("../services/email.service");

const asyncHandler = require("../utils/asyncHandler");

const submitContactForm = asyncHandler(async (req, res) => {
  const { tag, name, email, phone, message } = req.body;

  await sendContactEmail({
    tag,
    name,
    email,
    phone,
    message,
  });

  return res.status(200).json({
    success: true,

    message: "Message sent successfully",
  });
});

module.exports = {
  submitContactForm,
};
