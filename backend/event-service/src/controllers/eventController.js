const Event = require("../models/Event");

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ msg: "Lỗi lấy danh sách" });
    }
};

exports.createEvent = async (req, res) => {
    if (req.user.role !== "admin")
        return res.status(403).json({ msg: "Chỉ Admin mới được tạo" });
    try {
        const newEvent = await Event.create({
            ...req.body,
            createdBy: req.user.username,
        });
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(500).json({ msg: "Lỗi tạo sự kiện" });
    }
};

exports.deleteEvent = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Cấm" });
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ msg: "Đã xóa sự kiện" });
    } catch (err) {
        res.status(500).json({ msg: "Lỗi xóa" });
    }
};

exports.updateEvent = async (req, res) => {
    // 1. Check quyền Admin
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Cấm" });

    try {
        // 2. Tìm và update
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            req.body, // Dữ liệu mới gửi lên
            { new: true }, // Trả về data mới sau khi update
        );

        if (!updatedEvent)
            return res.status(404).json({ msg: "Không tìm thấy sự kiện" });

        res.json(updatedEvent);
    } catch (err) {
        res.status(500).json({ msg: "Lỗi cập nhật" });
    }
};
