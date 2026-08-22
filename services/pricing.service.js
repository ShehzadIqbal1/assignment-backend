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

const LINE_SPACING_MULTIPLIERS = {
  double: 1,
  single: 2,
};

const calculatePrice = ({ deadline, lineSpacing }) => {
  const basePrice = DEADLINE_RATES[deadline];

  if (basePrice === undefined) {
    throw new Error(`Invalid deadline: ${deadline}`);
  }

  const multiplier = LINE_SPACING_MULTIPLIERS[lineSpacing];

  if (multiplier === undefined) {
    throw new Error(`Invalid line spacing: ${lineSpacing}`);
  }

  const calculatedAmount = Number((basePrice * multiplier).toFixed(2));

  return {
    basePrice,

    lineSpacing,

    lineSpacingMultiplier: multiplier,

    calculatedAmount,

    discountAmount: 0,

    discountPercentage: 0,

    finalAmount: calculatedAmount,

    priceVersion: 1,
  };
};

module.exports = {
  calculatePrice,
  DEADLINE_RATES,
  LINE_SPACING_MULTIPLIERS,
};
