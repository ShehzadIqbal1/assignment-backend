const ApiError = require("../utils/ApiError");

// ============================================================
// DEADLINE RATES
// ============================================================

const DEADLINE_RATES = {
  "15 days": 9.0,
  "10 days": 10.2,
  "7 days": 10.25,
  "5 days": 10.3,
  "4 days": 11.1,
  "3 days": 11.15,
  "2 days": 12.15,
  "24 hours": 13.0,
  "12 hours": 13.85,
  "6 hours": 15.65,
  "3 hours": 15.7,
};

// ============================================================
// LINE SPACING
// ============================================================

const LINE_SPACING_MULTIPLIERS = {
  // User specified:
  // Double = x1

  double: 1,

  // User specified:
  // Single = x2

  single: 2,
};

// ============================================================
// CALCULATE PRICE
// ============================================================

const calculatePrice = ({ deadline, numberOfPages, lineSpacing }) => {
  if (!DEADLINE_RATES[deadline]) {
    throw new ApiError(400, "Invalid deadline");
  }

  if (!Number.isInteger(numberOfPages) || numberOfPages < 1) {
    throw new ApiError(400, "Number of pages must be at least 1");
  }

  if (!LINE_SPACING_MULTIPLIERS[lineSpacing]) {
    throw new ApiError(400, "Invalid line spacing");
  }

  const rate = DEADLINE_RATES[deadline];

  const lineSpacingMultiplier = LINE_SPACING_MULTIPLIERS[lineSpacing];

  const baseAmount = rate * numberOfPages;

  const calculatedAmount = baseAmount * lineSpacingMultiplier;

  return {
    rate,

    numberOfPages,

    lineSpacing,

    lineSpacingMultiplier,

    baseAmount: Number(baseAmount.toFixed(2)),

    calculatedAmount: Number(calculatedAmount.toFixed(2)),

    discountAmount: 0,

    finalAmount: Number(calculatedAmount.toFixed(2)),

    currency: "usd",
  };
};

module.exports = {
  DEADLINE_RATES,
  LINE_SPACING_MULTIPLIERS,
  calculatePrice,
};
