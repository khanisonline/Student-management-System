const express = require("express");
const router = express.Router();

const { createExam } = require("./exam.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");


router.post("/", protect, allowRoles("admin"), createExam);

module.exports = router;