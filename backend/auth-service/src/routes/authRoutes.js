const express = require("express");
const router = express.Router();
const {
    register,
    login,
    requestRefreshToken,
    logout,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

// API xin cấp lại token mới
router.post("/refresh", requestRefreshToken);

// API đăng xuất
router.post("/logout", logout);

module.exports = router;
