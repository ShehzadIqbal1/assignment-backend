const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const OrderEvent = require("../models/OrderEvent");

const ROLES = require("../constants/roles");
const ORDER_STATUS = require("../constants/orderStatus");
const ApiError = require("../utils/ApiError");
const generateOrderNumber = require("../utils/orderNumber");

const STAFF_TAG = "system";
const PANEL_ROLES = [
  ROLES.ADMIN,
  ROLES.SALES_AGENT,
  ROLES.WRITER,
  ROLES.WRITER_MANAGER,
];
const STAFF_ROLES = [ROLES.SALES_AGENT, ROLES.WRITER, ROLES.WRITER_MANAGER];
const WRITER_MANAGER_VISIBLE_STATUSES = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.DETAILS_MISSING,
  ORDER_STATUS.DETAILS_APPROVED,
  ORDER_STATUS.WRITER_ASSIGNED,
  ORDER_STATUS.IN_PROGRESS,
  ORDER_STATUS.SUBMITTED,
  ORDER_STATUS.REVISION_REQUESTED,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
];
const ADMIN_REASSIGN_STATUSES = [
  ORDER_STATUS.WRITER_ASSIGNED,
  ORDER_STATUS.IN_PROGRESS,
  ORDER_STATUS.REVISION_REQUESTED,
];

const ensureOrderNumber = async (order) => {
  const expected = generateOrderNumber({
    tag: order.tag,
    orderId: order._id,
  });

  // Already the correct student-facing ID
  if (order.orderNumber === expected) return order;

  order.orderNumber = expected;

  try {
    await order.save();
  } catch (err) {
    // Unique collision (rare): keep previous value
    if (err?.code !== 11000) throw err;
  }

  return order;
};

const buildUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  countryCode: user.countryCode,
  phoneNumber: user.phoneNumber,
  tag: user.tag,
  role: user.role,
  isActive: user.isActive,
  emailVerified: user.emailVerified,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

const assertPanelAccess = (role) => {
  if (!PANEL_ROLES.includes(role)) {
    throw new ApiError(403, "Panel access denied");
  }
};

// ============================================================
// DASHBOARD STATS
// ============================================================

const getStats = async (actor) => {
  assertPanelAccess(actor.role);

  if (actor.role === ROLES.WRITER) {
    const [assigned, inProgress, submitted, completed] = await Promise.all([
      Order.countDocuments({
        currentWriterId: actor.userId,
        status: ORDER_STATUS.WRITER_ASSIGNED,
      }),
      Order.countDocuments({
        currentWriterId: actor.userId,
        status: ORDER_STATUS.IN_PROGRESS,
      }),
      Order.countDocuments({
        currentWriterId: actor.userId,
        status: ORDER_STATUS.SUBMITTED,
      }),
      Order.countDocuments({
        currentWriterId: actor.userId,
        status: ORDER_STATUS.COMPLETED,
      }),
    ]);

    return {
      assigned,
      inProgress,
      submitted,
      completed,
      total: assigned + inProgress + submitted + completed,
    };
  }

  if (actor.role === ROLES.WRITER_MANAGER) {
    const [
      paid,
      detailsMissing,
      detailsApproved,
      writerAssigned,
      inProgress,
      submitted,
      completed,
    ] = await Promise.all([
      Order.countDocuments({ status: ORDER_STATUS.PAID }),
      Order.countDocuments({ status: ORDER_STATUS.DETAILS_MISSING }),
      Order.countDocuments({ status: ORDER_STATUS.DETAILS_APPROVED }),
      Order.countDocuments({ status: ORDER_STATUS.WRITER_ASSIGNED }),
      Order.countDocuments({ status: ORDER_STATUS.IN_PROGRESS }),
      Order.countDocuments({ status: ORDER_STATUS.SUBMITTED }),
      Order.countDocuments({ status: ORDER_STATUS.COMPLETED }),
    ]);

    return {
      paid,
      detailsMissing,
      detailsApproved,
      writerAssigned,
      inProgress,
      submitted,
      completed,
    };
  }

  const [
    totalOrders,
    awaitingPayment,
    paid,
    writerAssigned,
    inProgress,
    submitted,
    completed,
    totalStudents,
    totalWriters,
    totalSalesAgents,
    revenueAgg,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: ORDER_STATUS.AWAITING_PAYMENT }),
    Order.countDocuments({ status: ORDER_STATUS.PAID }),
    Order.countDocuments({ status: ORDER_STATUS.WRITER_ASSIGNED }),
    Order.countDocuments({ status: ORDER_STATUS.IN_PROGRESS }),
    Order.countDocuments({ status: ORDER_STATUS.SUBMITTED }),
    Order.countDocuments({ status: ORDER_STATUS.COMPLETED }),
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.WRITER }),
    User.countDocuments({ role: ROLES.SALES_AGENT }),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$pricing.finalAmount" } } },
    ]),
  ]);

  return {
    totalOrders,
    awaitingPayment,
    paid,
    writerAssigned,
    inProgress,
    submitted,
    completed,
    totalStudents,
    totalWriters,
    totalSalesAgents,
    revenue: revenueAgg[0]?.total || 0,
  };
};

// ============================================================
// STAFF (ADMIN ONLY)
// ============================================================

const 
createStaff = async (actor, data) => {
  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, "Only admin can create staff");
  }

  const { fullName, email, countryCode, phoneNumber, password, role } = data;

  if (!STAFF_ROLES.includes(role)) {
    throw new ApiError(400, "Role must be salesAgent, writer, or writerManager");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    throw new ApiError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    countryCode: countryCode.trim(),
    phoneNumber: phoneNumber.trim(),
    password: passwordHash,
    tag: STAFF_TAG,
    role,
    isActive: true,
    emailVerified: true,
  });

  return buildUserResponse(user);
};

const listStaff = async (actor, { role, search, page = 1, limit = 20 } = {}) => {
  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, "Only admin can list staff");
  }

  const filter = {
    role: { $in: [...STAFF_ROLES, ROLES.ADMIN] },
  };

  if (role && [...STAFF_ROLES, ROLES.ADMIN].includes(role)) {
    filter.role = role;
  }

  if (search) {
    const q = search.trim();
    filter.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map(buildUserResponse),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

const listWriters = async (actor) => {
  if (![ROLES.ADMIN, ROLES.WRITER_MANAGER].includes(actor.role)) {
    throw new ApiError(403, "Only admin or writer manager can list writers");
  }

  const writers = await User.find({
    role: ROLES.WRITER,
    isActive: true,
  }).sort({ fullName: 1 });

  return writers.map(buildUserResponse);
};

const updateStaffStatus = async (actor, userId, isActive) => {
  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, "Only admin can update staff status");
  }

  if (String(actor.userId) === String(userId)) {
    throw new ApiError(400, "You cannot deactivate your own account");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!STAFF_ROLES.includes(user.role)) {
    throw new ApiError(400, "Only staff members can be toggled here");
  }

  user.isActive = Boolean(isActive);
  await user.save();

  return buildUserResponse(user);
};

const updateStaffRole = async (actor, userId, role) => {
  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, "Only admin can update staff role");
  }

  if (String(actor.userId) === String(userId)) {
    throw new ApiError(400, "You cannot change your own role");
  }

  if (!STAFF_ROLES.includes(role)) {
    throw new ApiError(400, "Role must be salesAgent, writer, or writerManager");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!STAFF_ROLES.includes(user.role)) {
    throw new ApiError(400, "Only staff members can have their role changed here");
  }

  user.role = role;
  await user.save();

  return buildUserResponse(user);
};

const listStudents = async (
  actor,
  { search, tag, page = 1, limit = 20 } = {},
) => {
  if (![ROLES.ADMIN, ROLES.SALES_AGENT].includes(actor.role)) {
    throw new ApiError(403, "Access denied");
  }

  const filter = { role: ROLES.STUDENT };

  if (tag) {
    filter.tag = tag.trim().toLowerCase();
  }

  if (search) {
    const q = search.trim();
    filter.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phoneNumber: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map(buildUserResponse),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

// ============================================================
// ORDERS (ROLE FILTERED)
// ============================================================

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listOrders = async (
  actor,
  { status, paymentStatus, tag, search, page = 1, limit = 20 } = {},
) => {
  assertPanelAccess(actor.role);

  const filter = {};

  if (actor.role === ROLES.WRITER) {
    filter.currentWriterId = actor.userId;
  }

  if (actor.role === ROLES.WRITER_MANAGER) {
    if (status && WRITER_MANAGER_VISIBLE_STATUSES.includes(status)) {
      filter.status = status;
    } else if (status) {
      filter.status = { $in: [] };
    } else {
      filter.status = { $in: WRITER_MANAGER_VISIBLE_STATUSES };
    }
  } else if (status) {
    filter.status = status;
  }

  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (tag) filter.tag = tag.trim().toLowerCase();

  if (search) {
    const q = search.trim();
    const safe = escapeRegex(q);
    const people = await User.find({
      $or: [
        { fullName: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
        { phoneNumber: { $regex: safe, $options: "i" } },
      ],
    })
      .select("_id")
      .limit(100);

    const personIds = people.map((user) => user._id);

    filter.$or = [
      { orderNumber: { $regex: safe, $options: "i" } },
      { title: { $regex: safe, $options: "i" } },
      { subject: { $regex: safe, $options: "i" } },
      { assignmentType: { $regex: safe, $options: "i" } },
      { academicLevel: { $regex: safe, $options: "i" } },
      { tag: { $regex: safe, $options: "i" } },
      { status: { $regex: safe, $options: "i" } },
    ];

    if (personIds.length) {
      filter.$or.push(
        { studentId: { $in: personIds } },
        { currentWriterId: { $in: personIds } },
      );
    }

    if (/^[a-f\d]{24}$/i.test(q)) {
      filter.$or.push({ _id: q });
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("studentId", "fullName email phoneNumber countryCode tag")
      .populate("currentWriterId", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  // Convert ORD-*/AMVOC-* (and any other legacy IDs) to TP-/TN-/AP- format
  await Promise.all(orders.map((order) => ensureOrderNumber(order)));

  return {
    orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

const getOrderDetail = async (actor, orderId) => {
  assertPanelAccess(actor.role);

  const filter = { _id: orderId };

  if (actor.role === ROLES.WRITER) {
    filter.currentWriterId = actor.userId;
  }

  if (actor.role === ROLES.WRITER_MANAGER) {
    filter.status = { $in: WRITER_MANAGER_VISIBLE_STATUSES };
  }

  const order = await Order.findOne(filter)
    .populate("studentId", "fullName email phoneNumber countryCode tag role")
    .populate("currentWriterId", "fullName email phoneNumber")
    .populate("pricing.priceEditedBy", "fullName email role");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  await ensureOrderNumber(order);

  const [payment, events] = await Promise.all([
    Payment.findOne({ orderId: order._id }),
    OrderEvent.find({ orderId: order._id })
      .populate("userId", "fullName email role")
      .sort({ createdAt: 1 }),
  ]);

  return { order, payment, events };
};

// ============================================================
// ASSIGN WRITER
// First assign: admin or writer manager, from detailsApproved only.
// Reassign: admin only, while writerAssigned / inProgress / revisionRequested.
// ============================================================

const assignWriter = async (actor, orderId, writerId) => {
  const isAdmin = actor.role === ROLES.ADMIN;
  const isWriterManager = actor.role === ROLES.WRITER_MANAGER;

  if (!isAdmin && !isWriterManager) {
    throw new ApiError(403, "Only admin or writer manager can assign writers");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isFirstAssign = order.status === ORDER_STATUS.DETAILS_APPROVED;
  const isReassign = ADMIN_REASSIGN_STATUSES.includes(order.status);

  if (isWriterManager && !isFirstAssign) {
    throw new ApiError(
      400,
      "Writer manager can only assign a writer when details are approved",
    );
  }

  if (isAdmin && !isFirstAssign && !isReassign) {
    throw new ApiError(
      400,
      "Writer can only be assigned after details are approved",
    );
  }

  const writer = await User.findOne({
    _id: writerId,
    role: ROLES.WRITER,
    isActive: true,
  });

  if (!writer) {
    throw new ApiError(404, "Active writer not found");
  }

  const previousStatus = order.status;
  const previousWriterId = order.currentWriterId;

  order.currentWriterId = writer._id;

  if (isFirstAssign || order.status === ORDER_STATUS.WRITER_ASSIGNED) {
    order.status = ORDER_STATUS.WRITER_ASSIGNED;
  }

  await order.save();

  await OrderEvent.create({
    orderId: order._id,
    userId: actor.userId,
    role: actor.role,
    action: "writerAssigned",
    fromStatus: previousStatus,
    toStatus: order.status,
    metadata: {
      previousWriterId,
      writerId: writer._id,
      writerEmail: writer.email,
    },
  });

  return Order.findById(order._id)
    .populate("studentId", "fullName email phoneNumber countryCode tag")
    .populate("currentWriterId", "fullName email phoneNumber");
};

// ============================================================
// STATUS UPDATE (ROLE RULES)
// ============================================================

const ALLOWED_TRANSITIONS = {
  [ROLES.ADMIN]: {
    [ORDER_STATUS.PAID]: [
      ORDER_STATUS.DETAILS_MISSING,
      ORDER_STATUS.DETAILS_APPROVED,
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.DETAILS_MISSING]: [
      ORDER_STATUS.DETAILS_APPROVED,
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.DETAILS_APPROVED]: [
      ORDER_STATUS.DETAILS_MISSING,
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.WRITER_ASSIGNED]: [
      ORDER_STATUS.IN_PROGRESS,
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.IN_PROGRESS]: [
      ORDER_STATUS.SUBMITTED,
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.SUBMITTED]: [
      ORDER_STATUS.REVISION_REQUESTED,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.REVISION_REQUESTED]: [
      ORDER_STATUS.IN_PROGRESS,
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.REFUNDED],
    [ORDER_STATUS.AWAITING_PAYMENT]: [ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.DRAFT]: [ORDER_STATUS.CANCELLED],
  },
  [ROLES.WRITER_MANAGER]: {
    [ORDER_STATUS.PAID]: [
      ORDER_STATUS.DETAILS_MISSING,
      ORDER_STATUS.DETAILS_APPROVED,
    ],
    [ORDER_STATUS.DETAILS_MISSING]: [ORDER_STATUS.DETAILS_APPROVED],
    [ORDER_STATUS.DETAILS_APPROVED]: [ORDER_STATUS.DETAILS_MISSING],
  },
  [ROLES.SALES_AGENT]: {
    [ORDER_STATUS.SUBMITTED]: [
      ORDER_STATUS.REVISION_REQUESTED,
      ORDER_STATUS.COMPLETED,
    ],
    [ORDER_STATUS.REVISION_REQUESTED]: [ORDER_STATUS.IN_PROGRESS],
  },
  [ROLES.WRITER]: {
    [ORDER_STATUS.WRITER_ASSIGNED]: [ORDER_STATUS.IN_PROGRESS],
    [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.SUBMITTED],
    [ORDER_STATUS.REVISION_REQUESTED]: [ORDER_STATUS.IN_PROGRESS],
  },
};

const updateOrderStatus = async (actor, orderId, status) => {
  assertPanelAccess(actor.role);

  const filter = { _id: orderId };

  if (actor.role === ROLES.WRITER) {
    filter.currentWriterId = actor.userId;
  }

  if (actor.role === ROLES.WRITER_MANAGER) {
    filter.status = { $in: WRITER_MANAGER_VISIBLE_STATUSES };
  }

  const order = await Order.findOne(filter);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const allowedNext = ALLOWED_TRANSITIONS[actor.role]?.[order.status] || [];

  if (!allowedNext.includes(status)) {
    throw new ApiError(
      400,
      `Cannot change status from "${order.status}" to "${status}" with your role`,
    );
  }

  const previousStatus = order.status;
  order.status = status;

  if (status === ORDER_STATUS.COMPLETED) {
    order.completedAt = new Date();
  }

  await order.save();

  await OrderEvent.create({
    orderId: order._id,
    userId: actor.userId,
    role: actor.role,
    action: "statusUpdated",
    fromStatus: previousStatus,
    toStatus: status,
  });

  return Order.findById(order._id)
    .populate("studentId", "fullName email phoneNumber countryCode tag")
    .populate("currentWriterId", "fullName email phoneNumber");
};

module.exports = {
  getStats,
  createStaff,
  listStaff,
  listWriters,
  updateStaffStatus,
  updateStaffRole,
  listStudents,
  listOrders,
  getOrderDetail,
  assignWriter,
  updateOrderStatus,
};
