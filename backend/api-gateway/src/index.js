const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors()); // Cho phép Frontend gọi vào Gateway

// 1. Auth Service
app.use(
    "/api/auth",
    createProxyMiddleware({
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        pathRewrite: { "^/api/auth": "/" },
    }),
);

// 2. Event Service
app.use(
    "/api/events",
    createProxyMiddleware({
        target: "http://127.0.0.1:5002",
        changeOrigin: true,
        pathRewrite: { "^/api/events": "/" },
    }),
);

// 3. Chat Service (Chỉ proxy API HTTP nếu có, còn Socket client sẽ nối thẳng 5003)

const PORT = process.env.PORT || 8000;
app.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀 API Gateway running on port ${PORT}`),
);
