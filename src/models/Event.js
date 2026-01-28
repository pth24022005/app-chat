const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // VD: "Hội thảo AI 2025"
        description: { type: String }, // VD: "Trao đổi về ChatGPT"
        isActive: { type: Boolean, default: true },
        createdBy: { type: String, required: true }, // Lưu tên Admin tạo
    },
    { timestamps: true },
);

module.exports = mongoose.model("Event", eventSchema);
