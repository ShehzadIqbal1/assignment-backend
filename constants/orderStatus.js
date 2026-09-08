const ORDER_STATUS = {
  DRAFT: "draft",

  AWAITING_PAYMENT: "awaitingPayment",

  PAID: "paid",

  DETAILS_MISSING: "detailsMissing",

  DETAILS_APPROVED: "detailsApproved",

  WRITER_ASSIGNED: "writerAssigned",

  IN_PROGRESS: "inProgress",

  SUBMITTED: "submitted",

  REVISION_REQUESTED: "revisionRequested",

  COMPLETED: "completed",

  CANCELLED: "cancelled",

  REFUNDED: "refunded",
};

module.exports = ORDER_STATUS;
