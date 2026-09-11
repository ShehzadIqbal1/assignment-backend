const TAG_PREFIX = {
  tutorspath: "TP",
  tutorsnext: "TN",
  tutorspie: "TS",
  assignmentpro: "AP",
};

/**
 * Student-facing order ID format:
 *   TutorsPath     → TP-F1735008
 *   TutorsNext     → TN-A1B2C3D4
 *   AssignmentPro  → AP-A1B2C3D4
 *
 * Uses website tag prefix + last 8 chars of MongoDB _id.
 */
const generateOrderNumber = ({ tag, orderId } = {}) => {
  const normalizedTag = String(tag || "")
    .trim()
    .toLowerCase();

  const prefix =
    TAG_PREFIX[normalizedTag] ||
    normalizedTag
      .replace(/[^a-z]/g, "")
      .slice(0, 2)
      .toUpperCase() ||
    "TP";

  const suffix = String(orderId || "")
    .replace(/[^a-f0-9]/gi, "")
    .slice(-8)
    .toUpperCase()
    .padStart(8, "0");

  return `${prefix}-${suffix}`;
};

const isStudentOrderNumber = (value) =>
  typeof value === "string" && /^[A-Z]{2}-[A-F0-9]{8}$/i.test(value.trim());

module.exports = generateOrderNumber;
module.exports.isStudentOrderNumber = isStudentOrderNumber;
module.exports.TAG_PREFIX = TAG_PREFIX;
