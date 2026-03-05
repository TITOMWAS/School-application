const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/refresh-token", userController.refreshToken);
router.post("/request-password-reset", userController.requestPasswordReset);
router.post("/reset-password", userController.resetPassword);

router.get("/me", authMiddleware.authenticate, userController.getCurrentUser);
router.post("/change-password", authMiddleware.authenticate, userController.changePassword);
router.get("/login-history", authMiddleware.authenticate, userController.getLoginHistory);

router.get("/users", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.getAllUsers);
router.get("/users/search", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.searchUsers);
router.get("/users/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.getUserById);
router.put("/users/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.updateUser);
router.delete("/users/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.deactivateUser);

router.post("/parent-student/link", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.linkStudentToParent);
router.delete("/parent-student/link/:parentId/:studentId", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.unlinkStudentFromParent);
router.get("/parent-student/children/:parentId", authMiddleware.authenticate, userController.getChildrenByParent);
router.get("/parent-student/parents/:studentId", authMiddleware.authenticate, userController.getParentsByStudent);

router.post("/subjects", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.createSubject);
router.get("/subjects", authMiddleware.authenticate, userController.getAllSubjects);
router.get("/subjects/:id", authMiddleware.authenticate, userController.getSubjectById);
router.put("/subjects/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.updateSubject);

router.post("/teacher-subject/assign", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.assignSubjectToTeacher);
router.delete("/teacher-subject/:teacherId/:subjectId", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.removeSubjectFromTeacher);
router.get("/teacher-subject/teacher/:teacherId", authMiddleware.authenticate, userController.getTeacherSubjects);
router.get("/teacher-subject/subject/:subjectId", authMiddleware.authenticate, userController.getSubjectTeachers);

module.exports = router;

