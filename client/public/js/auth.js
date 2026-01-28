import { API_ROUTES } from "./config.js";

// --- PHẦN 1: CÁC HÀM DÙNG CHUNG (Export để file khác dùng) ---

export function getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
}

export function requireAuth(roleRequired = null) {
    const user = getUser();
    const token = localStorage.getItem("accessToken");
    if (!user || !token) {
        window.location.href = "/login.html";
        return null;
    }
    if (roleRequired && user.role !== roleRequired) {
        alert("Không có quyền truy cập!");
        window.location.href = "/index.html";
        return null;
    }
    return user;
}

export function logout() {
    localStorage.clear();
    window.location.href = "/login.html";
}

// Hàm gọi API (Thay thế cho file api.js cũ)
export async function request(url, method = "GET", body = null) {
    const token = localStorage.getItem("accessToken");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const res = await fetch(url, config);
        const data = await res.json();
        if (res.status === 401) {
            logout(); // Hết hạn token thì logout luôn
            return null;
        }
        if (!res.ok) throw new Error(data.msg || "Lỗi Server");
        return data;
    } catch (err) {
        console.error(err);
        alert(err.message);
        throw err;
    }
}

// --- PHẦN 2: LOGIC TRANG LOGIN & REGISTER ---

document.addEventListener("DOMContentLoaded", () => {
    // Xử lý Form Đăng Nhập
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            try {
                const res = await fetch(API_ROUTES.AUTH_LOGIN, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });
                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem("accessToken", data.accessToken);
                    localStorage.setItem(
                        "user",
                        JSON.stringify({
                            username: data.username,
                            role: data.role,
                        }),
                    );
                    window.location.href =
                        data.role === "admin" ? "/admin.html" : "/index.html";
                } else {
                    document.getElementById("error-msg").innerText = data.msg;
                    document
                        .getElementById("error-msg")
                        .classList.remove("hidden");
                }
            } catch (err) {
                alert("Lỗi kết nối");
            }
        });
    }

    // Xử lý Form Đăng Ký
    const regForm = document.getElementById("register-form");
    if (regForm) {
        regForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("reg-username").value;
            const password = document.getElementById("reg-password").value;

            try {
                const res = await fetch(API_ROUTES.AUTH_REGISTER, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });
                const data = await res.json();
                if (res.ok) {
                    alert("Đăng ký thành công! Hãy đăng nhập.");
                    window.location.href = "login.html";
                } else {
                    document.getElementById("reg-error").innerText = data.msg;
                    document
                        .getElementById("reg-error")
                        .classList.remove("hidden");
                }
            } catch (err) {
                alert("Lỗi kết nối");
            }
        });
    }
});
