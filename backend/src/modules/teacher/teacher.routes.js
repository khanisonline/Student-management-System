const express = require("express");
const router = express.Router();

const {
    getTeacherDashboard,
    getMySections,
    getMyCourses,
    getStudentsInSection,
    markAttendance,
    getAttendance,
    addMarks,
    updateMarks,
    getMarks,
    createAssignment,
    getMyAssignments
} = require("./teacher.controller");

const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.use(protect, allowRoles("teacher"));

router.get("/dashboard", getTeacherDashboard);
router.get("/sections", getMySections);
router.get("/courses", getMyCourses);
router.get("/sections/:id/students", getStudentsInSection);
router.post("/attendance", markAttendance);
router.get("/attendance/:sectionId/:courseId", getAttendance);
router.post("/marks", addMarks);
router.patch("/marks/:id", updateMarks);
router.get("/marks/:courseId", getMarks);
router.post("/assignments", createAssignment);
router.get("/assignments", getMyAssignments);

module.exports = router;
