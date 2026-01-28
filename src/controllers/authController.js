const bcrypt = require("bcrypt");
const User = require("../models/User");

// @desc    Đăng ký tài khoản
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ msg: "Thiếu thông tin đăng ký" });

        const exist = await User.findOne({ username });
        if (exist) return res.status(400).json({ msg: "Tài khoản đã tồn tại" });

        const hash = await bcrypt.hash(password, 10);
        await User.create({ username, password: hash, role: "user" });

        res.status(201).json({ msg: "Đăng ký thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Lỗi server" });
    }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ msg: "Sai tài khoản" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ msg: "Sai mật khẩu" });

        res.json({
            username: user.username,
            role: user.role,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Lỗi server" });
    }
};

module.exports = { register, login };
