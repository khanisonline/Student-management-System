const router = require("express").Router();
const { getRequests } = require("./studentRequest.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.get("/", protect, getRequests);

module.exports = router;