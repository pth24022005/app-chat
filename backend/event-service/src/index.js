const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const eventRoutes = require("./routes/eventRoutes");

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.use("/", eventRoutes);

// Tìm dòng cuối cùng và sửa thành:
const PORT = process.env.PORT || 5002;
app.listen(PORT, "0.0.0.0", () =>
    console.log(`📅 Event Service running on port ${PORT}`),
);
