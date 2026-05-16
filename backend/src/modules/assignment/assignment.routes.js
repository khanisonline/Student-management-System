const router = require("express").Router();
const {
  getStudentAssignments,
  submitAssignment
} = require("./assignment.controller");

const { protect } = require("../../middlewares/auth.middleware");

router.get("/", protect, getStudentAssignments);
router.post("/submit", protect, submitAssignment);

module.exports = router;