// client/public/js/config.js

const API_BASE = "/api";

const API_ROUTES = {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    EVENTS: `${API_BASE}/events`, // Dùng cho cả Lấy list, Tạo, Xóa
};

// Hàm kiểm tra đăng nhập chung
function requireAuth(roleRequired = null) {
    const userStr = localStorage.getItem("user");

    // 1. Chưa đăng nhập -> đá về login
    if (!userStr) {
        window.location.href = "/login.html";
        return null;
    }

    const user = JSON.parse(userStr);

    // 2. Nếu trang yêu cầu quyền Admin mà user không phải Admin
    if (roleRequired && user.role !== roleRequired) {
        alert("Bạn không có quyền truy cập trang này!");
        window.location.href = "/index.html";
        return null;
    }

    return user;
}

// Hàm đăng xuất
function logout() {
    localStorage.clear();
    window.location.href = "/login.html";
}
