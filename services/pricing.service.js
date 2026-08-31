// ============================================================
// WEBSITE PRICING CONFIGURATION
// ============================================================
//
// Every website can have its own:
//
// - Currency
// - Deadline rates
// - Add-on prices
//
// The pricing formula is:
//
// deadline rate
// × line spacing multiplier
// × number of pages
// + add-ons
//
// Add-ons are optional.
//
// ============================================================

const WEBSITE_PRICING = {
  tutorspath: {
    currency: "usd",

    // USD uses cents
    subunitFactor: 100,

    deadlineRates: {
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
    },

    addons: {
      "Grammar Check Report": 6.75,
      "One Page Summary": 15.7,
      "Abstract Page": 15.7,
      "Quality Double-check": 3.92,
    },
  },

  tutorsnext: {
    currency: "usd",

    // USD uses cents
    subunitFactor: 100,

    deadlineRates: {
      "15 days": 8.25,
      "10 days": 9.45,
      "7 days": 9.5,
      "5 days": 9.55,
      "4 days": 10.35,
      "3 days": 10.4,
      "2 days": 11.4,
      "24 hours": 12.25,
      "12 hours": 13.1,
      "6 hours": 14.9,
      "3 hours": 14.95,
    },

    addons: {
      "Grammar Check Report": 6.0,
      "One Page Summary": 14.95,
      "Abstract Page": 14.95,
      "Quality Double-check": 3.17,
    },
  },
};

// ============================================================
// LINE SPACING MULTIPLIERS
// ============================================================

const LINE_SPACING_MULTIPLIERS = {
  double: 1,
  single: 2,
};

// ============================================================
// ROUND MONEY
// ============================================================

const roundMoney = (amount) => {
  return Number(Number(amount).toFixed(2));
};

// ============================================================
// CONVERT MAJOR CURRENCY UNIT TO SUBUNIT
//
// USD:
// $15.70 -> 1570 cents
//
// ============================================================

const toSubunit = (amount, subunitFactor) => {
  return Math.round(Number(amount) * subunitFactor);
};

// ============================================================
// GET WEBSITE PRICING
// ============================================================

const getWebsitePricing = (tag) => {
  if (!tag || typeof tag !== "string") {
    throw new Error("Website tag is required");
  }

  const normalizedTag = tag.trim().toLowerCase();

  const website = WEBSITE_PRICING[normalizedTag];

  if (!website) {
    throw new Error(`Unsupported website tag: ${tag}`);
  }

  return {
    ...website,
    tag: normalizedTag,
  };
};

// ============================================================
// CALCULATE ORDER PRICE
// ============================================================
//
// Formula:
//
// deadline rate
// × line spacing multiplier
// × number of pages
// + add-ons
//
// Example:
//
// TutorsPath
// 3 hours = $15.70
// 4 pages
// double = ×1
//
// 15.70 × 1 × 4 = $62.80
//
// Grammar Check = $6.75
//
// Total = $69.55
//
// ============================================================

const calculatePrice = ({
  tag,
  deadline,
  lineSpacing,
  numberOfPages,
  addOns = [],
}) => {
  const website = getWebsitePricing(tag);

  // ----------------------------------------------------------
  // Validate number of pages
  // ----------------------------------------------------------

  const pages = Number(numberOfPages);

  if (!Number.isInteger(pages) || pages < 1) {
    throw new Error("Number of pages must be at least 1");
  }

  // ----------------------------------------------------------
  // Validate deadline
  // ----------------------------------------------------------

  const deadlineRate = website.deadlineRates[deadline];

  if (deadlineRate === undefined) {
    throw new Error(
      `Invalid deadline "${deadline}" for website "${website.tag}"`,
    );
  }

  // ----------------------------------------------------------
  // Validate line spacing
  // ----------------------------------------------------------

  const lineSpacingMultiplier =
    LINE_SPACING_MULTIPLIERS[lineSpacing];

  if (lineSpacingMultiplier === undefined) {
    throw new Error(
      `Invalid line spacing: ${lineSpacing}`,
    );
  }

  // ----------------------------------------------------------
  // Validate add-ons
  //
  // Add-ons are OPTIONAL.
  //
  // [] is completely valid.
  // ----------------------------------------------------------

  if (!Array.isArray(addOns)) {
    throw new Error("addOns must be an array");
  }

  // ----------------------------------------------------------
  // Calculate assignment amount
  // ----------------------------------------------------------

  const assignmentAmount = roundMoney(
    deadlineRate *
      lineSpacingMultiplier *
      pages,
  );

  // ----------------------------------------------------------
  // Calculate add-ons
  // ----------------------------------------------------------

  let addOnsAmount = 0;

  const selectedAddOns = [];

  for (const addOnName of addOns) {
    if (typeof addOnName !== "string") {
      throw new Error(
        "Each add-on must be a string",
      );
    }

    const normalizedAddOn = addOnName.trim();

    if (!normalizedAddOn) {
      throw new Error(
        "Add-on name cannot be empty",
      );
    }

    const addOnPrice =
      website.addons[normalizedAddOn];

    if (addOnPrice === undefined) {
      throw new Error(
        `Invalid add-on "${normalizedAddOn}" for website "${website.tag}"`,
      );
    }

    addOnsAmount = roundMoney(
      addOnsAmount + addOnPrice,
    );

    // Store a snapshot of the add-on price
    selectedAddOns.push({
      name: normalizedAddOn,
      price: addOnPrice,
    });
  }

  // ----------------------------------------------------------
  // Calculate total before discount
  // ----------------------------------------------------------

  const calculatedAmount = roundMoney(
    assignmentAmount + addOnsAmount,
  );

  // ----------------------------------------------------------
  // Initial order has no discount
  // ----------------------------------------------------------

  const discountAmount = 0;

  const discountPercentage = 0;

  const finalAmount = calculatedAmount;

  // ----------------------------------------------------------
  // Stripe/payment subunit
  // ----------------------------------------------------------

  const amountInSubunits = toSubunit(
    finalAmount,
    website.subunitFactor,
  );

  // ----------------------------------------------------------
  // Return complete pricing snapshot
  // ----------------------------------------------------------

  return {
    tag: website.tag,

    currency: website.currency,

    subunitFactor: website.subunitFactor,

    rate: deadlineRate,

    numberOfPages: pages,

    lineSpacingMultiplier,

    assignmentAmount,

    addOns: selectedAddOns,

    addOnsAmount,

    calculatedAmount,

    discountAmount,

    discountPercentage,

    finalAmount,

    amountInSubunits,

    priceVersion: 1,
  };
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  WEBSITE_PRICING,
  LINE_SPACING_MULTIPLIERS,
  getWebsitePricing,
  calculatePrice,
  toSubunit,
  roundMoney,
};