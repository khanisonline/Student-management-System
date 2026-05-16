const express = require("express");
const router = express.Router();

const { getAIInsights } = require("./ai.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.get("/insights", protect, allowRoles("student"), getAIInsights);

module.exports = router;