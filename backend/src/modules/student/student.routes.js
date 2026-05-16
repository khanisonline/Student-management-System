const express = require("express");
const router = express.Router();

const {
    getDashboard,
    getMyAttendance,
    getMyMarks,
    getAssignments,
    applyLeave,
    getMyLeaves,
    getDatesheet,
    getFullDashboard,
    getStudentInsights,
    analyzeStudentPerformance,
    submitAssignment
} = require("./student.controller");

const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");
const upload = require("../../middlewares/upload.middleware");

router.use(protect, allowRoles("student"));

router.get("/dashboard", getDashboard);
router.get("/attendance", getMyAttendance);
router.get("/marks", getMyMarks);
router.get("/assignments", getAssignments);
router.post("/leave", applyLeave);
router.get("/leave", getMyLeaves);
router.get("/datesheet", getDatesheet);
router.get("/full-dashboard", getFullDashboard);
router.get("/insights", getStudentInsights);
router.post("/insights/analyze", analyzeStudentPerformance);

router.post(
    "/submit-assignment",
    upload.single("file"),
    submitAssignment
);

module.exports = router;
