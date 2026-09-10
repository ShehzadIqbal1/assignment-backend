const paymentService = require("../services/payment.service");

const asyncHandler = require("../utils/asyncHandler");

// ============================================================
// CREATE PAYMENT INTENT
// ============================================================

const createPaymentIntent = asyncHandler(async (req, res) => {
  const result = await paymentService.createPaymentIntent({
    orderId: req.params.orderId,

    studentId: req.user.userId,

    paymentMethod: req.body.paymentMethod || "stripe",
  });

  return res.status(200).json({
    success: true,

    message: "Payment intent ready",

    data: result,
  });
});

// ============================================================
// STRIPE WEBHOOK
// ============================================================

const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({
      success: false,

      message: "Missing Stripe signature",
    });
  }

  await paymentService.handleStripeWebhook(
    req.body,

    signature,
  );

  return res.status(200).json({
    received: true,
  });
});

const generatePaymentLink = asyncHandler(
async(req,res)=>{


const result =
await paymentService.createOrderPaymentLink({

orderId:req.params.orderId,

actorId:req.user.userId

});


return res.status(200).json({

success:true,

message:
"Payment link generated successfully",

data:result

});


});

module.exports = {
  createPaymentIntent,
  stripeWebhook,
  generatePaymentLink,
};
