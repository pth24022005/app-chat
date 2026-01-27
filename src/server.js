const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// serve frontend
app.use(express.static(path.join(__dirname, "../client/public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/index.html"));
});

// socket
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-event", async ({ username, eventId }) => {
    socket.join(eventId);
    socket.username = username;
    socket.eventId = eventId;

    // load lịch sử chat
    const history = await Message.find({ eventId })
      .sort({ createdAt: 1 })
      .limit(100);

    socket.emit("chat-history", history);

    socket.to(eventId).emit("system-message", `${username} joined`);
  });

  socket.on("chat-message", async (text) => {
    if (!socket.eventId) return;

    const msg = await Message.create({
      username: socket.username,
      eventId: socket.eventId,
      text,
    });

    io.to(socket.eventId).emit("chat-message", msg);
  });

  socket.on("disconnect", () => {
    if (socket.eventId) {
      socket.to(socket.eventId).emit(
        "system-message",
        `${socket.username} left`
      );
    }
  });
});

// mongo
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);

server.listen(5000, () => {
  console.log("EventLive server running on port 5000");
});
