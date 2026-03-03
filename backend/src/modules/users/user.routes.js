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
router.get("/users/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.getUserById);
router.put("/users/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.updateUser);
router.delete("/users/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), userController.deactivateUser);

module.exports = router;

