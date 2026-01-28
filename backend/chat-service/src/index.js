const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const amqp = require("amqplib"); // Thư viện RabbitMQ
const connectDB = require("./config/db");
const Message = require("./models/Message");
require("dotenv").config();

const app = express();
app.use(cors());

// Kết nối DB
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// --- CẤU HÌNH RABBITMQ ---
const RABBIT_URL = "amqp://guest:guest@localhost:5672";
const QUEUE_NAME = "chat_messages_queue";
let channel = null;

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBIT_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log("🐰 Connected to RabbitMQ");

        // --- CONSUMER (WORKER) ---
        // Đây là "công nhân" ngồi chờ tin nhắn từ hàng đợi để lưu vào DB
        channel.consume(QUEUE_NAME, async (data) => {
            if (data !== null) {
                const msgData = JSON.parse(data.content.toString());

                try {
                    // Lưu vào MongoDB (Tác vụ tốn thời gian được xử lý ở đây)
                    await Message.create(msgData);
                    // console.log("💾 Saved to DB via Queue:", msgData.text);

                    // Báo cho RabbitMQ biết là đã xử lý xong
                    channel.ack(data);
                } catch (err) {
                    console.error("Lỗi lưu DB từ Queue:", err);
                    // Nếu lỗi thì không ack để RabbitMQ gửi lại sau (hoặc xử lý DLQ)
                }
            }
        });
    } catch (err) {
        console.error("❌ RabbitMQ Connection Error:", err.message);
        console.log("⚠️ Running in fallback mode (Direct DB Save)");
    }
}

// Gọi hàm kết nối
connectRabbitMQ();

// --- SOCKET.IO LOGIC ---
io.on("connection", (socket) => {
    // console.log("⚡ Client connected:", socket.id);

    // 1. Tham gia sự kiện
    socket.on("join-event", async ({ username, eventId, role }) => {
        socket.join(eventId);
        socket.currentEvent = eventId;
        socket.username = username;

        // Đếm số người
        const room = io.sockets.adapter.rooms.get(eventId);
        const count = room ? room.size : 0;
        io.to(eventId).emit("update-user-count", count);

        // Lấy lịch sử chat (Vẫn lấy trực tiếp từ DB để user mới vào xem được ngay)
        try {
            const messages = await Message.find({ eventId })
                .sort({ createdAt: 1 })
                .limit(50);
            socket.emit("chat-history", messages);
        } catch (err) {
            console.error(err);
        }
    });

    // 2. Chat message (SỬ DỤNG RABBITMQ)
    socket.on("chat-message", async (msgText) => {
        if (!socket.currentEvent) return;

        const msgData = {
            username: socket.username,
            text: msgText,
            eventId: socket.currentEvent,
            createdAt: new Date(),
        };

        // BƯỚC A: Gửi ngay lập tức cho mọi người (Real-time)
        // Không cần đợi DB lưu xong mới gửi -> Chat cực nhanh
        io.to(socket.currentEvent).emit("chat-message", msgData);

        // Gửi cho Admin dashboard
        io.emit("admin-new-message", msgData);

        // BƯỚC B: Đẩy vào Message Queue để lưu DB sau (Async)
        if (channel) {
            channel.sendToQueue(
                QUEUE_NAME,
                Buffer.from(JSON.stringify(msgData)),
                { persistent: true },
            );
        } else {
            // Fallback: Nếu RabbitMQ chết thì lưu trực tiếp để không mất tin
            await Message.create(msgData);
        }
    });

    // 3. Admin xóa event
    socket.on("admin-delete-event", (eventId) => {
        io.to(eventId).emit("admin-event-deleted", eventId);
    });

    // 4. Ngắt kết nối
    socket.on("disconnect", () => {
        if (socket.currentEvent) {
            const room = io.sockets.adapter.rooms.get(socket.currentEvent);
            const count = room ? room.size : 0;
            io.to(socket.currentEvent).emit("update-user-count", count);
        }
    });
});

const PORT = process.env.PORT || 5003;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`💬 Chat Service running on port ${PORT}`);
});
