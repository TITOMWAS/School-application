const express = require("express");
const router = express.Router();
const attendanceController = require("./attendance.controller");
const { authenticate, authorize, isAdminOrTeacher, isAdmin } = require("../../middlewares/auth.middleware");

router.use(authenticate);

router.post(
  "/",
  authorize("admin", "teacher"),
  attendanceController.markAttendance
);

router.post(
  "/bulk",
  authorize("admin", "teacher"),
  attendanceController.bulkMarkAttendance
);

router.get(
  "/class/:classId/missing",
  authorize("admin", "teacher"),
  attendanceController.getStudentsWithoutAttendance
);

router.get(
  "/summary/class/:classId",
  authorize("admin", "teacher", "parent"),
  attendanceController.getClassAttendanceSummary
);

router.get(
  "/summary/student/:studentId",
  authorize("admin", "teacher", "parent", "student"),
  attendanceController.getStudentAttendanceSummary
);

router.put(
  "/:id/lock",
  authorize("admin", "teacher"),
  attendanceController.lockAttendance
);

router.put(
  "/:id/unlock",
  authorize("admin"),
  attendanceController.unlockAttendance
);

router.put(
  "/class/:classId/lock",
  authorize("admin", "teacher"),
  attendanceController.lockClassAttendance
);

router.put(
  "/class/:classId/unlock",
  authorize("admin"),
  attendanceController.unlockClassAttendance
);

router.get(
  "/stats",
  authorize("admin"),
  attendanceController.getAttendanceStats
);

router.get(
  "/student/:studentId",
  authorize("admin", "teacher", "parent", "student"),
  attendanceController.getAttendanceByStudent
);

router.get(
  "/class/:classId",
  authorize("admin", "teacher"),
  attendanceController.getAttendanceByClass
);

router.get(
  "/date/:date",
  authorize("admin", "teacher"),
  attendanceController.getAttendanceByDate
);

router.get(
  "/:id",
  authorize("admin", "teacher"),
  attendanceController.getAttendanceById
);

router.put(
  "/:id",
  authorize("admin", "teacher"),
  attendanceController.updateAttendance
);

router.delete(
  "/:id",
  authorize("admin"),
  attendanceController.deleteAttendance
);

module.exports = router;

