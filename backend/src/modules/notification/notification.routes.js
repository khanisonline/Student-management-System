const express = require("express");
const router = express.Router();

const { getNotifications, markAsRead } = require("./notification.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { createDummyNotification } = require("./notification.controller");


router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);
router.post("/test", protect, createDummyNotification);

module.exports = router;