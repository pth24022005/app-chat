const Event = require("../models/Event");
const Message = require("../models/Message");

// Lấy danh sách sự kiện (Dùng cho cả Admin và User)
const getEvents = async (req, res) => {
    try {
        const events = await Event.find({ isActive: true }).sort({
            createdAt: -1,
        });
        res.json(events);
    } catch (err) {
        res.status(500).json({ msg: "Lỗi server" });
    }
};

// Tạo sự kiện mới (Chỉ Admin)
const createEvent = async (req, res) => {
    try {
        const { name, description, username } = req.body;
        const newEvent = await Event.create({
            name,
            description,
            createdBy: username,
        });
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(500).json({ msg: "Lỗi tạo sự kiện" });
    }
};

// Xóa sự kiện (Chỉ Admin)
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await Event.findByIdAndDelete(id);
        // Xóa luôn tin nhắn của sự kiện đó cho sạch
        await Message.deleteMany({ eventId: id });
        res.json({ msg: "Đã xóa sự kiện" });
    } catch (err) {
        res.status(500).json({ msg: "Lỗi xóa sự kiện" });
    }
};

module.exports = { getEvents, createEvent, deleteEvent };
