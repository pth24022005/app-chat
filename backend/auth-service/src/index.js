const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// Kết nối DB
connectDB();

// Routes
app.use("/", authRoutes); // Đường dẫn gốc sẽ là /auth/login

const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () =>
    console.log(`🔐 Auth Service running on port ${PORT}`),
);
