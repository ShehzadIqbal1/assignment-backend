const adminService = require("../services/admin.service");
const asyncHandler = require("../utils/asyncHandler");

const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStats(req.user);

  return res.status(200).json({
    success: true,
    data: { stats },
  });
});

const createStaff = asyncHandler(async (req, res) => {
  const user = await adminService.createStaff(req.user, req.body);

  return res.status(201).json({
    success: true,
    message: "Staff member created successfully",
    data: { user },
  });
});

const listStaff = asyncHandler(async (req, res) => {
  const result = await adminService.listStaff(req.user, req.query);

  return res.status(200).json({
    success: true,
    data: result,
  });
});

const listWriters = asyncHandler(async (req, res) => {
  const writers = await adminService.listWriters(req.user);

  return res.status(200).json({
    success: true,
    data: { writers },
  });
});

const updateStaffStatus = asyncHandler(async (req, res) => {
  const user = await adminService.updateStaffStatus(
    req.user,
    req.params.userId,
    req.body.isActive,
  );

  return res.status(200).json({
    success: true,
    message: "Staff status updated",
    data: { user },
  });
});

const updateStaffRole = asyncHandler(async (req, res) => {
  const user = await adminService.updateStaffRole(
    req.user,
    req.params.userId,
    req.body.role,
  );

  return res.status(200).json({
    success: true,
    message: "Staff role updated",
    data: { user },
  });
});

const listStudents = asyncHandler(async (req, res) => {
  const result = await adminService.listStudents(req.user, req.query);

  return res.status(200).json({
    success: true,
    data: result,
  });
});

const listOrders = asyncHandler(async (req, res) => {
  const result = await adminService.listOrders(req.user, req.query);

  return res.status(200).json({
    success: true,
    data: result,
  });
});

const getOrderDetail = asyncHandler(async (req, res) => {
  const result = await adminService.getOrderDetail(
    req.user,
    req.params.orderId,
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
});

const assignWriter = asyncHandler(async (req, res) => {
  const order = await adminService.assignWriter(
    req.user,
    req.params.orderId,
    req.body.writerId,
  );

  return res.status(200).json({
    success: true,
    message: "Writer assigned successfully",
    data: { order },
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await adminService.updateOrderStatus(
    req.user,
    req.params.orderId,
    req.body.status,
  );

  return res.status(200).json({
    success: true,
    message: "Order status updated",
    data: { order },
  });
});

//
const createStudent = asyncHandler(async (req, res) => {
  const user = await adminService.createStudent(req.user, req.body);

  return res.status(201).json({
    success: true,
    message: "Student created successfully",
    data: { user },
  });
});

const getStudentDetail = asyncHandler(async (req, res) => {
  const result = await adminService.getStudentDetail(
    req.user,
    req.params.userId,
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
});

const updateStudent = asyncHandler(async (req, res) => {
  const user = await adminService.updateStudent(
    req.user,
    req.params.userId,
    req.body,
  );

  return res.status(200).json({
    success: true,
    message: "Student updated successfully",
    data: { user },
  });
});

const updateStudentStatus = asyncHandler(async (req, res) => {
  const user = await adminService.updateStudentStatus(
    req.user,
    req.params.userId,
    req.body.isActive,
  );

  return res.status(200).json({
    success: true,
    message: "Student status updated",
    data: { user },
  });
});

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
  createStudent,
  getStudentDetail,
  updateStudent,
  updateStudentStatus,
};
