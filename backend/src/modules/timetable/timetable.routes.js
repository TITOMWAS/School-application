const express = require("express");
const router = express.Router();
const timetableController = require("./timetable.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/teachers/:teacherId/timetable", authMiddleware.authenticate, timetableController.getTimetableByTeacher);

router.get("/teachers/:teacherId/availability", authMiddleware.authenticate, timetableController.getTeacherAvailability);

router.post("/timetable", authMiddleware.authenticate, authMiddleware.authorize("admin"), timetableController.createTimetableSlot);
router.get("/timetable", authMiddleware.authenticate, authMiddleware.authorize("admin"), timetableController.getAllTimetable);
router.get("/timetable/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), timetableController.getTimetableById);
router.put("/timetable/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), timetableController.updateTimetableSlot);
router.delete("/timetable/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), timetableController.deleteTimetableSlot);

router.get("/classes/:classId/timetable", authMiddleware.authenticate, authMiddleware.authorize("admin"), timetableController.getTimetableByClass);
router.get("/subjects/:subjectId/timetable", authMiddleware.authenticate, authMiddleware.authorize("admin"), timetableController.getTimetableBySubject);

router.post("/teachers/availability", authMiddleware.authenticate, authMiddleware.authorize("admin"), timetableController.setTeacherAvailability);
router.post("/teachers/availability/bulk", authMiddleware.authenticate, authMiddleware.authorize("admin"), timetableController.bulkSetTeacherAvailability);

router.post("/timetable/check-conflicts", authMiddleware.authenticate, authMiddleware.authorize("admin"), timetableController.checkTimetableConflicts);

module.exports = router;

