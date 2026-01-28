const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Nơi lưu Refresh Token tạm thời (Trong thực tế nên lưu vào Redis hoặc Database)
let refreshTokens = [];

// 1. ĐĂNG KÝ
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser)
            return res.status(400).json({ msg: "Tên đăng nhập đã tồn tại" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const role = username === "admin" ? "admin" : "user";

        const newUser = new User({ username, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ msg: "Đăng ký thành công" });
    } catch (err) {
        res.status(500).json({ msg: "Lỗi Server" });
    }
};

// 2. ĐĂNG NHẬP (Tạo 2 Tokens)
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user)
            return res.status(400).json({ msg: "Sai tài khoản hoặc mật khẩu" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ msg: "Sai tài khoản hoặc mật khẩu" });

        const payload = {
            id: user._id,
            username: user.username,
            role: user.role,
        };

        // A. Tạo Access Token (Sống 15 phút)
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "15m",
        });

        // B. Tạo Refresh Token (Sống 7 ngày)
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d",
        });

        // Lưu Refresh Token vào bộ nhớ server
        refreshTokens.push(refreshToken);

        res.json({
            accessToken,
            refreshToken,
            username: user.username,
            role: user.role,
        });
    } catch (err) {
        res.status(500).json({ msg: "Lỗi Server" });
    }
};

// 3. CẤP LẠI TOKEN (REFRESH)
exports.requestRefreshToken = async (req, res) => {
    // Lấy refresh token từ client gửi lên
    const { refreshToken } = req.body;

    if (!refreshToken)
        return res.status(401).json({ msg: "Bạn chưa đăng nhập!" });

    // Kiểm tra token này có hợp lệ trong kho không
    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ msg: "Token không hợp lệ!" });
    }

    try {
        // Kiểm tra chữ ký và hạn sử dụng
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET,
        );

        // Tạo Access Token MỚI
        const newPayload = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
        };
        const newAccessToken = jwt.sign(newPayload, process.env.JWT_SECRET, {
            expiresIn: "15m",
        });

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error(err);
        return res.status(403).json({ msg: "Phiên đăng nhập hết hạn" });
    }
};

// 4. ĐĂNG XUẤT (LOGOUT)
exports.logout = (req, res) => {
    const { refreshToken } = req.body;
    // Xóa token khỏi danh sách -> Token đó vô hiệu luôn
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    res.json({ msg: "Đăng xuất thành công" });
};
