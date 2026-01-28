// Tạo màu hex từ chuỗi (cho Avatar)
export function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

// Format ngày giờ đầy đủ (14:30 20/10/2025)
export function formatDate(dateString) {
    if (!dateString) return "Chưa có lịch";
    return new Date(dateString).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

// Format giờ ngắn (14:30)
export function formatTime(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Lấy màu badge theo category
export function getBadgeColor(category) {
    const map = {
        "Giải trí": "bg-pink-100 text-pink-700",
        "Học tập": "bg-yellow-100 text-yellow-700",
        "Họp nội bộ": "bg-gray-100 text-gray-700",
    };
    return map[category] || "bg-indigo-100 text-indigo-700";
}
