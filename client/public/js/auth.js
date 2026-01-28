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

    try {
        const res = await fetch(API_ROUTES.LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.msg || "Đăng nhập thất bại");

        // Lưu user và chuyển hướng
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href =
            data.role === "admin" ? "/admin.html" : "/index.html";
    } catch (err) {
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

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg);

        // Success
        msg.className = "text-green-500 text-xs text-center font-medium";
        msg.innerText = "Đăng ký thành công! Đang chuyển hướng...";
        setTimeout(() => (window.location.href = "/login.html"), 1500);
    } catch (err) {
        msg.className = "text-red-500 text-xs text-center font-medium";
        msg.innerText = err.message;
        btnText.classList.remove("hidden");
        spinner.classList.add("hidden");
        regBtn.disabled = false;
    }
}

// Gắn sự kiện Logout (dùng chung cho các trang)
function logout() {
    localStorage.clear();
    window.location.href = "/login.html";
}
