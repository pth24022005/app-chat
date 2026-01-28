const Message = require("../models/Message");
const jwt = require("jsonwebtoken");

module.exports = (io) => {
    // Middleware kiểm tra Token của Socket
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Vui lòng đăng nhập"));

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error("Token lỗi"));
            socket.user = decoded; // Lưu thông tin user vào socket
            next();
        });
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user.username}`);

        socket.on("join-event", async ({ eventId }) => {
            socket.join(eventId);
            // Gửi lại lịch sử chat
            const history = await Message.find({ eventId }).sort({
                createdAt: 1,
            });
            socket.emit("chat-history", history);

            // Nếu là admin, admin sẽ lắng nghe tất cả (logic này có thể mở rộng sau)
            if (socket.user.role === "admin") {
                socket.join("admin-room");
            }
        });

        socket.on("chat-message", async (text) => {
            // Lấy eventId từ phòng mà user đang tham gia
            // Lưu ý: Socket.io v4 rooms là Set, cần chuyển sang Array để lấy
            const rooms = Array.from(socket.rooms);
            // Room [0] là socket.id, Room [1] thường là eventId
            const eventId = rooms.find(
                (r) => r !== socket.id && r !== "admin-room",
            );

            if (!eventId) return;

            const msg = await Message.create({
                username: socket.user.username,
                role: socket.user.role,
                eventId,
                text,
            });

            io.to(eventId).emit("chat-message", msg);
            io.to("admin-room").emit("admin-new-message", msg);
        });

        // Admin xóa sự kiện -> báo cho client
        socket.on("admin-delete-event", (eventId) => {
            if (socket.user.role === "admin") {
                io.emit("admin-event-deleted", eventId);
            }
        });
    });
};
