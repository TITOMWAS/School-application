const express = require("express");
const router = express.Router();
const paymentsController = require("./payments.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router.post("/fee-structures", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.createFeeStructure);
router.get("/fee-structures/year/:academicYearId", authMiddleware.authenticate, paymentsController.getFeeStructuresByYear);
router.get("/fee-structures/:id", authMiddleware.authenticate, paymentsController.getFeeStructureById);
router.put("/fee-structures/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.updateFeeStructure);
router.delete("/fee-structures/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.deleteFeeStructure);


router.post("/student-fees", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.assignFeeToStudent);
router.post("/class-fees", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.assignFeeToClass);
router.get("/student-fees/student/:studentId", authMiddleware.authenticate, paymentsController.getStudentFees);
router.get("/class-fees/class/:classId", authMiddleware.authenticate, authMiddleware.authorize("admin", "teacher"), paymentsController.getClassFees);
router.put("/student-fees/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.updateStudentFee);


router.post("/", authMiddleware.authenticate, authMiddleware.authorize("admin", "parent"), paymentsController.createPayment);
router.post("/:id/complete", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.completePayment);
router.get("/:id", authMiddleware.authenticate, paymentsController.getPaymentById);
router.get("/student/:studentId/payments", authMiddleware.authenticate, paymentsController.getPaymentsByStudent);


router.post("/callback", paymentsController.handlePaymentCallback);


router.get("/reports/collection/:academicYearId", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.getFeeCollectionReport);
router.post("/reconciliations", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.createReconciliation);
router.get("/reconciliations/:academicYearId", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.getReconciliations);


router.post("/paystack/initialize", authMiddleware.authenticate, authMiddleware.authorize("admin", "parent"), paymentsController.initializePaystackPayment);
router.get("/paystack/verify/:reference", paymentsController.verifyPaystackPayment);
router.post("/paystack/webhook", paymentsController.handlePaystackWebhook);
router.post("/paystack/payment-link", authMiddleware.authenticate, authMiddleware.authorize("admin"), paymentsController.createPaystackPaymentLink);


router.post("/mobile-money/charge", authMiddleware.authenticate, authMiddleware.authorize("admin", "parent"), paymentsController.chargeMobileMoney);

module.exports = router;

