const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: String,

        // --- CÁC TRƯỜNG MỚI THÊM ---
        startDate: { type: Date, required: true }, // Thời gian bắt đầu
        location: { type: String, default: "Online" }, // Địa điểm (VD: Hội trường A hoặc Zoom)
        category: {
            type: String,
            enum: ["Hội thảo", "Giải trí", "Học tập", "Họp nội bộ"], // Chỉ cho phép các loại này
            default: "Hội thảo",
        },
        maxParticipants: { type: Number, default: 100 }, // Giới hạn người tham gia
        // ----------------------------

        createdBy: String,
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Event", eventSchema);
