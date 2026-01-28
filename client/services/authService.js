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
        alert("Bạn không có quyền truy cập trang này!");
        window.location.href = "/index.html";
        return null;
    }

    return user;
}

export function logout() {
    localStorage.clear();
    window.location.href = "/login.html";
}
