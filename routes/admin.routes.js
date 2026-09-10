const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const ROLES = require("../constants/roles");
const controller = require("../controllers/admin.controller");

const {
  createStaffValidator,
  updateStaffStatusValidator,
  updateStaffRoleValidator,
  orderIdValidator,
  assignWriterValidator,
  updateStatusValidator,
  listOrdersQueryValidator,
  createStudentValidator,
  userIdValidator,
  updateStudentValidator,
  updateStudentStatusValidator,
} = require("../validators/admin.validator");

const router = express.Router();

const panelRoles = [
  ROLES.ADMIN,
  ROLES.SALES_AGENT,
  ROLES.WRITER,
  ROLES.WRITER_MANAGER,
];

router.use(authenticate);

router.get("/stats", authorize(...panelRoles), controller.getStats);

router.post(
  "/staff",
  authorize(ROLES.ADMIN),
  createStaffValidator,
  validate,
  controller.createStaff,
);

router.get("/staff", authorize(ROLES.ADMIN), controller.listStaff);

router.get(
  "/writers",
  authorize(ROLES.ADMIN, ROLES.WRITER_MANAGER),
  controller.listWriters,
);

router.patch(
  "/staff/:userId/status",
  authorize(ROLES.ADMIN),
  updateStaffStatusValidator,
  validate,
  controller.updateStaffStatus,
);

router.patch(
  "/staff/:userId/role",
  authorize(ROLES.ADMIN),
  updateStaffRoleValidator,
  validate,
  controller.updateStaffRole,
);

router.get(
  "/students",
  authorize(ROLES.ADMIN, ROLES.SALES_AGENT),
  controller.listStudents,
);

router.get(
  "/orders",
  authorize(...panelRoles),
  listOrdersQueryValidator,
  validate,
  controller.listOrders,
);

router.get(
  "/orders/:orderId",
  authorize(...panelRoles),
  orderIdValidator,
  validate,
  controller.getOrderDetail,
);

router.patch(
  "/orders/:orderId/assign-writer",
  authorize(ROLES.ADMIN, ROLES.WRITER_MANAGER),
  assignWriterValidator,
  validate,
  controller.assignWriter,
);

router.patch(
  "/orders/:orderId/status",
  authorize(...panelRoles),
  updateStatusValidator,
  validate,
  controller.updateOrderStatus,
);

//
router.post(
  "/students",
  authorize(ROLES.ADMIN, ROLES.SALES_AGENT),
  createStudentValidator,
  validate,
  controller.createStudent,
);

router.get(
  "/students/:userId",
  authorize(ROLES.ADMIN, ROLES.SALES_AGENT),
  userIdValidator,
  validate,
  controller.getStudentDetail,
);

router.patch(
  "/students/:userId",
  authorize(ROLES.ADMIN, ROLES.SALES_AGENT),
  updateStudentValidator,
  validate,
  controller.updateStudent,
);

router.patch(
  "/students/:userId/status",
  authorize(ROLES.ADMIN, ROLES.SALES_AGENT),
  updateStudentStatusValidator,
  validate,
  controller.updateStudentStatus,
);

module.exports = router;
