const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/public")));

// ===== AUTH =====
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ msg: "Thiếu thông tin" });

    const exist = await User.findOne({ username });
    if (exist)
      return res.status(400).json({ msg: "Tài khoản đã tồn tại" });

    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash, role: "user" });

    res.json({ msg: "Đăng ký thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Lỗi server" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ msg: "Sai tài khoản" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ msg: "Sai mật khẩu" });

  res.json({
    username: user.username,
    role: user.role,
  });
});

// ===== SOCKET =====
io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.id);

  // ===== JOIN EVENT =====
  socket.on("join-event", async ({ username, eventId, role }) => {
    socket.username = username;
    socket.eventId = eventId;
    socket.role = role || "user";

    // ===== ADMIN =====
    if (socket.role === "admin") {
      const allMessages = await Message.find().sort({ createdAt: 1 });
      socket.emit("admin-all-messages", allMessages);
      return;
    }

    // ===== USER =====
    socket.join(eventId);

    const history = await Message.find({ eventId }).sort({ createdAt: 1 });
    socket.emit("chat-history", history);

    socket.to(eventId).emit(
      "system-message",
      `${username} joined the chat`
    );
  });

  // ===== CHAT MESSAGE =====
  socket.on("chat-message", async (text) => {
    if (!socket.eventId || !socket.username) return;

    const msg = await Message.create({
      username: socket.username,
      role: socket.role || "user",
      eventId: socket.eventId,
      text,
    });

    io.to(socket.eventId).emit("chat-message", msg);
    io.emit("admin-new-message", msg);
  });

  // ===== ADMIN DELETE EVENT =====
  socket.on("admin-delete-event", async (eventId) => {
    if (socket.role !== "admin") return;

    await Message.deleteMany({ eventId });

    io.emit("admin-event-deleted", eventId);

    console.log("🗑️ Event deleted:", eventId);
  });
});

// ===== DB + SERVER =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(console.error);

server.listen(5000, () =>
  console.log("🚀 Server running at http://localhost:5000")
);
