const express = require("express");
const router = express.Router();
const classController = require("./class.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/students/:studentId/classes", authMiddleware.authenticate, classController.getStudentClasses);

router.post("/classes", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.createClass);
router.get("/classes", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.getAllClasses);
router.get("/classes/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.getClassById);
router.put("/classes/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.updateClass);
router.delete("/classes/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.deleteClass);
router.put("/classes/:id/teacher", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.assignClassTeacher);

router.post("/class-subjects", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.assignSubjectToClass);
router.delete("/class-subjects/:classId/:subjectId/:academicYearId", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.removeSubjectFromClass);
router.get("/classes/:classId/subjects", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.getClassSubjects);
router.get("/subjects/:subjectId/classes", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.getSubjectClasses);
router.put("/class-subjects/:classId/:subjectId/:academicYearId/teacher", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.updateClassSubjectTeacher);

router.post("/enrollments", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.enrollStudentInClass);
router.delete("/enrollments/:classId/:studentId/:academicYearId", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.unenrollStudentFromClass);
router.get("/classes/:classId/students", authMiddleware.authenticate, authMiddleware.authorize("admin"), classController.getClassStudents);

module.exports = router;

