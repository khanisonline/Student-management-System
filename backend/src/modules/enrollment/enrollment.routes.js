const router = require("express").Router();
const { approveStudent, rejectStudent, getMyEnrollment } = require("./enrollment.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.post("/approve", protect, approveStudent);
router.post("/reject", protect, rejectStudent);
router.get("/me", protect, getMyEnrollment);

module.exports = router;
