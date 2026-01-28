// Hàm request chung cho toàn dự án
export async function request(url, method = "GET", body = null) {
    const token = localStorage.getItem("accessToken"); // Lấy Access Token

    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const res = await fetch(url, config);
        const data = await res.json();

        // Nếu lỗi 401 (Hết hạn Token) hoặc 403
        if (res.status === 401 || res.status === 403) {
            // Ở đây có thể thêm logic gọi Refresh Token tự động
            // Nhưng để đơn giản, ta cho logout luôn
            alert("Phiên đăng nhập hết hạn.");
            localStorage.clear();
            window.location.href = "/login.html";
            return null;
        }

        if (!res.ok) throw new Error(data.msg || "Lỗi Server");

        return data;
    } catch (err) {
        console.error("API Error:", err);
        throw err;
    }
}
