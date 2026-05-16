const express = require("express");
const router = express.Router();

const {
    getAdminDashboard,
    createUser,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getDepartments,
    createDepartment,
    assignTeacherToDepartment,
    getSections,
    createSection,
    assignTeacherToSection,
    assignStudentToSection,
    getCourses,
    createCourse,
    getAllLeaves,
    getExams,
    reviewLeave
} = require("./admin.controller");

const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.use(protect, allowRoles("admin"));

router.get("/dashboard", getAdminDashboard);

router.get("/departments", getDepartments);
router.post("/departments", createDepartment);
router.post("/departments/assign-teacher", assignTeacherToDepartment);

router.get("/sections", getSections);
router.post("/sections", createSection);
router.post("/sections/assign-teacher", assignTeacherToSection);
router.post("/sections/assign-student", assignStudentToSection);

router.get("/courses", getCourses);
router.post("/courses", createCourse);

router.get("/exams", getExams);
router.get("/leaves", getAllLeaves);
router.patch("/leaves/:id/review", reviewLeave);

router.post("/users", createUser);
router.get("/users", getAllUsers);
router.get("/users/:id", getUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/toggle", toggleUserStatus);

module.exports = router;
