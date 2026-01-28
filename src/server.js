const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors"); // Nên cài thêm gói này: npm install cors
const eventRoutes = require("./routes/eventRoutes");
require("dotenv").config();

// Import các module đã tách
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const socketHandler = require("./socket/socketHandler");

// Khởi tạo App
const app = express();
const server = http.createServer(app);

// Cấu hình Socket.io (Cho phép CORS để Frontend connect được)
const io = new Server(server, {
    cors: {
        origin: "*", // Trong thực tế nên thay '*' bằng domain frontend cụ thể
        methods: ["GET", "POST"],
    },
});

// 1. Kết nối Database
connectDB();

// 2. Middlewares
app.use(cors()); // Cho phép gọi API từ tên miền khác
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/public")));

// 3. Routes
// Đường dẫn sẽ thành: /api/auth/register và /api/auth/login
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

// 4. Socket Logic
socketHandler(io);

// 5. Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
