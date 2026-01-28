const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");
const Event = require("./models/Event");

async function seed() {
    try {
        console.log("⏳ Đang kết nối MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);

        // --- 1. TẠO ADMIN (Kiểm tra trước để không bị lỗi trùng) ---
        const adminExist = await User.findOne({ username: "admin" });

        if (!adminExist) {
            // Mã hóa password "123"
            const adminPassword = await bcrypt.hash("123", 10);

            await User.create({
                username: "admin",
                password: adminPassword,
                role: "admin",
            });
            console.log("✅ Đã tạo tài khoản Admin (Pass: 123)");
        } else {
            console.log(
                "⚠️ Tài khoản Admin đã tồn tại -> Bỏ qua bước tạo Admin.",
            );
        }

        // --- 2. TẠ0 SỰ KIỆN MẪU ---
        // Vì bạn muốn giữ dữ liệu cũ, code này sẽ tạo thêm 2 sự kiện mới
        // mỗi lần bạn chạy file seed.
        await Event.create([
            {
                name: "Hội thảo Công nghệ 2025",
                description: "Bàn về AI và Blockchain",
                createdBy: "admin",
            },
            {
                name: "Giao lưu Âm nhạc",
                description: "Sự kiện chill cuối tuần",
                createdBy: "admin",
            },
        ]);

        console.log("✅ Đã thêm 2 sự kiện mẫu thành công.");
        process.exit();
    } catch (error) {
        console.error("❌ Lỗi khi seed data:", error);
        process.exit(1);
    }
}

seed();
