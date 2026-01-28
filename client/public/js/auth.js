// client/public/js/auth.js

// --- XỬ LÝ LOGIN ---
async function handleLogin() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    if (!username || !password) {
        msg.innerText = "Vui lòng nhập đầy đủ thông tin";
        return;
    }

    // Hiển thị trạng thái đang xử lý
    msg.innerText = "Đang kết nối...";
    msg.className = "text-blue-500 text-xs text-center mb-2 font-medium";

    try {
        const res = await fetch(API_ROUTES.LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        // --- ĐOẠN FIX QUAN TRỌNG: Kiểm tra Content-Type ---
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            // Nếu server trả về HTML lỗi (504 Gateway Timeout, 404, etc.)
            throw new Error(
                `Lỗi kết nối Server (${res.status}: ${res.statusText}). Vui lòng kiểm tra lại Backend.`,
            );
        }

        const data = await res.json();

        if (!res.ok) throw new Error(data.msg || "Đăng nhập thất bại");

        // Lưu Token và User
        localStorage.setItem("token", data.token);
        localStorage.setItem(
            "user",
            JSON.stringify({
                username: data.username,
                role: data.role,
            }),
        );

        // Chuyển hướng
        window.location.href =
            data.role === "admin" ? "/admin.html" : "/index.html";
    } catch (err) {
        console.error(err);
        msg.className = "text-red-500 text-xs text-center mb-2 font-bold";
        msg.innerText = err.message;
    }
}

// --- XỬ LÝ REGISTER ---
async function handleRegister() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;

    const msg = document.getElementById("msg");
    const btnText = document.getElementById("btnText");
    const spinner = document.getElementById("spinner");
    const regBtn = document.getElementById("regBtn");

    if (!username || !password) return (msg.innerText = "Thiếu thông tin!");
    if (password !== password2) return (msg.innerText = "Mật khẩu không khớp!");

    // UI Loading
    msg.innerText = "";
    btnText.classList.add("hidden");
    spinner.classList.remove("hidden");
    regBtn.disabled = true;

    try {
        const res = await fetch(API_ROUTES.REGISTER, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        // Kiểm tra Content-Type
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`Lỗi kết nối Server (${res.status})`);
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg);

        // Success
        msg.className = "text-green-500 text-xs text-center font-medium";
        msg.innerText = "Đăng ký thành công! Đang chuyển hướng...";
        setTimeout(() => (window.location.href = "/login.html"), 1500);
    } catch (err) {
        msg.className = "text-red-500 text-xs text-center font-medium";
        msg.innerText = err.message;

        // Reset nút bấm
        btnText.classList.remove("hidden");
        spinner.classList.add("hidden");
        regBtn.disabled = false;
    }
}
