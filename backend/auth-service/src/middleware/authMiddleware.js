const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // 1. Lấy token từ Header (Dạng: "Bearer eyJhbGciOi...")
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Lấy phần sau chữ Bearer

    if (!token) {
        return res
            .status(401)
            .json({ msg: "Không có quyền truy cập (Thiếu Token)" });
    }

    try {
        // 2. Giải mã Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Gắn thông tin user vào request để các hàm sau dùng
        req.user = decoded;

        next(); // Cho phép đi tiếp
    } catch (err) {
        return res
            .status(403)
            .json({ msg: "Token không hợp lệ hoặc đã hết hạn" });
    }
};

module.exports = verifyToken;
