const Message = require("../models/Message");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("🔌 New Connection:", socket.id);

        // ===== JOIN EVENT =====
        socket.on("join-event", async ({ username, eventId, role }) => {
            socket.username = username;
            socket.eventId = eventId;
            socket.role = role || "user";

            // Role: ADMIN
            if (socket.role === "admin") {
                try {
                    const allMessages = await Message.find().sort({
                        createdAt: 1,
                    });
                    socket.emit("admin-all-messages", allMessages);
                } catch (err) {
                    console.error("Lỗi lấy tin nhắn admin:", err);
                }
                return;
            }

            // Role: USER
            socket.join(eventId);
            try {
                const history = await Message.find({ eventId }).sort({
                    createdAt: 1,
                });
                socket.emit("chat-history", history);
                socket
                    .to(eventId)
                    .emit(
                        "system-message",
                        `${username} đã tham gia cuộc trò chuyện`,
                    );
            } catch (err) {
                console.error("Lỗi lấy lịch sử chat:", err);
            }
        });

        // ===== CHAT MESSAGE =====
        socket.on("chat-message", async (text) => {
            if (!socket.eventId || !socket.username) return;

            try {
                const msg = await Message.create({
                    username: socket.username,
                    role: socket.role || "user",
                    eventId: socket.eventId,
                    text,
                });

                // Gửi cho user trong phòng
                io.to(socket.eventId).emit("chat-message", msg);
                // Gửi riêng cho admin (để admin thấy tất cả)
                io.emit("admin-new-message", msg);
            } catch (err) {
                console.error("Lỗi lưu tin nhắn:", err);
            }
        });

        // ===== ADMIN DELETE EVENT =====
        socket.on("admin-delete-event", async (eventId) => {
            if (socket.role !== "admin") return;

            try {
                await Message.deleteMany({ eventId });
                io.emit("admin-event-deleted", eventId);
                console.log("🗑️ Admin deleted event:", eventId);
            } catch (err) {
                console.error("Lỗi xóa sự kiện:", err);
            }
        });

        socket.on("disconnect", () => {
            // Có thể handle user rời phòng tại đây nếu cần
            console.log("❌ Disconnected:", socket.id);
        });
    });
};
