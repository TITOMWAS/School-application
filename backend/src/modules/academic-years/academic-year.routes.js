const express = require("express");
const router = express.Router();
const academicYearController = require("./academic-year.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/current-year", authMiddleware.authenticate, academicYearController.getCurrentAcademicYear);
router.get("/current-term", authMiddleware.authenticate, academicYearController.getCurrentTerm);

router.get("/terms", authMiddleware.authenticate, academicYearController.getAllTerms);

router.post("/academic-years", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.createAcademicYear);
router.get("/academic-years", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.getAllAcademicYears);
router.get("/academic-years/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.getAcademicYearById);
router.put("/academic-years/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.updateAcademicYear);
router.delete("/academic-years/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.deleteAcademicYear);
router.put("/academic-years/:id/set-current", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.setCurrentAcademicYear);

router.post("/terms", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.createTerm);
router.get("/academic-years/:academicYearId/terms", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.getTermsByAcademicYear);
router.get("/terms/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.getTermById);
router.put("/terms/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.updateTerm);
router.delete("/terms/:id", authMiddleware.authenticate, authMiddleware.authorize("admin"), academicYearController.deleteTerm);

module.exports = router;

