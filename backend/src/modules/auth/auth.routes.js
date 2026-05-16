const express = require("express");
const router = express.Router();

const {
    signupUser,
    loginUser,
    getProfile,
    changePassword,
    forgotPassword,
    resetPassword
} = require("./auth.controller");

const { protect } = require("../../middlewares/auth.middleware");

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;