// client/public/js/admin.js

// 1. Kiểm tra quyền Admin
const user = requireAuth("admin");
if (!user) throw new Error("Unauthorized");

// 2. Kết nối Socket
const token = localStorage.getItem("token");
const socket = io(CHAT_SERVICE_URL, {
    auth: { token: token },
});

socket.emit("join-event", { role: "admin" });

// Biến toàn cục
let eventsMessages = {};
let allEventsCache = []; // Lưu lại danh sách sự kiện để lấy dữ liệu khi bấm sửa
let editingEventId = null; // Nếu null => Đang tạo mới. Nếu có ID => Đang sửa

// --- PHẦN 1: QUẢN LÝ SỰ KIỆN (CRUD) ---

async function loadEvents() {
    try {
        const res = await fetch(API_ROUTES.EVENTS);
        const events = await res.json();
        allEventsCache = events; // Lưu vào cache
        renderEvents(events);
    } catch (err) {
        console.error("Lỗi tải sự kiện:", err);
    }
}

function renderEvents(events) {
    const grid = document.getElementById("event-grid");
    grid.innerHTML = "";

    if (!events || events.length === 0) {
        grid.innerHTML =
            "<p class='text-gray-400 col-span-full text-center'>Chưa có sự kiện nào.</p>";
        return;
    }

    events.forEach((evt) => {
        const div = document.createElement("div");
        div.className =
            "bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition relative group cursor-pointer flex flex-col justify-between";

        // Format ngày tháng
        let dateStr = "Chưa có ngày";
        if (evt.startDate) {
            dateStr = new Date(evt.startDate).toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        }

        // Màu sắc category
        let badgeColor = "bg-indigo-100 text-indigo-700";
        if (evt.category === "Giải trí")
            badgeColor = "bg-pink-100 text-pink-700";
        if (evt.category === "Học tập")
            badgeColor = "bg-yellow-100 text-yellow-700";
        if (evt.category === "Họp nội bộ")
            badgeColor = "bg-gray-100 text-gray-700";

        div.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] ${badgeColor} px-2 py-1 rounded font-bold uppercase tracking-wider">${evt.category || "Event"}</span>
                    <span class="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">ACTIVE</span>
                </div>
                <h3 class="font-bold text-lg text-slate-800 line-clamp-1 mb-1" title="${evt.name}">${evt.name}</h3>
                <div class="text-xs text-gray-500 mb-3 flex flex-col gap-1">
                    <p>📅 ${dateStr}</p>
                    <p>📍 ${evt.location || "Online"}</p>
                </div>
                <p class="text-sm text-slate-500 mb-4 h-10 line-clamp-2">${evt.description || "Không có mô tả"}</p>
            </div>
            
            <div class="flex justify-between items-center border-t pt-3 mt-auto">
                <button onclick="openModal('${evt._id}', '${evt.name}')" class="text-indigo-600 text-xs font-bold hover:underline">Xem Chat</button>
                
                <div class="flex gap-2">
                    <button onclick="openEditForm(event, '${evt._id}')" class="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition text-xs font-bold flex items-center gap-1">
                        ✏️ Sửa
                    </button>
                    <button onclick="deleteEvent(event, '${evt._id}')" class="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition text-xs font-bold flex items-center gap-1">
                        🗑 Xóa
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(div);
    });
}

// --- LOGIC FORM (TẠO MỚI & SỬA) ---

// 1. Mở form TẠO MỚI
window.openCreateForm = () => {
    editingEventId = null; // Reset ID

    // UI Reset
    document.getElementById("modal-form-title").innerText = "Tạo sự kiện mới";
    document.getElementById("btn-save-event").innerText = "Tạo ngay";

    // Clear Input
    document.getElementById("new-event-name").value = "";
    document.getElementById("new-event-desc").value = "";
    document.getElementById("new-event-location").value = "";
    document.getElementById("new-event-date").value = "";
    document.getElementById("new-event-category").value = "Hội thảo";

    document.getElementById("create-modal").classList.remove("hidden");
};

// 2. Mở form SỬA
window.openEditForm = (e, id) => {
    e.stopPropagation(); // Ngăn mở chat modal

    const evt = allEventsCache.find((x) => x._id === id);
    if (!evt) return;

    editingEventId = id; // Set ID đang sửa

    // UI Set
    document.getElementById("modal-form-title").innerText = "Cập nhật sự kiện";
    document.getElementById("btn-save-event").innerText = "Lưu thay đổi";

    // Fill Data
    document.getElementById("new-event-name").value = evt.name;
    document.getElementById("new-event-desc").value = evt.description || "";
    document.getElementById("new-event-location").value = evt.location || "";
    document.getElementById("new-event-category").value =
        evt.category || "Hội thảo";

    // Xử lý ngày tháng cho input datetime-local
    if (evt.startDate) {
        const d = new Date(evt.startDate);
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = new Date(d - offset).toISOString().slice(0, 16);
        document.getElementById("new-event-date").value = localISOTime;
    }

    document.getElementById("create-modal").classList.remove("hidden");
};

// 3. Xử lý LƯU (Chung cho cả Tạo & Sửa)
window.handleSaveEvent = async () => {
    const name = document.getElementById("new-event-name").value;
    const desc = document.getElementById("new-event-desc").value;
    const startDate = document.getElementById("new-event-date").value;
    const location = document.getElementById("new-event-location").value;
    const category = document.getElementById("new-event-category").value;

    if (!name || !startDate) return alert("Vui lòng nhập tên và thời gian!");

    const payload = {
        name,
        description: desc,
        startDate,
        location,
        category,
        username: user.username,
    };

    try {
        let res;

        if (editingEventId) {
            // --- SỬA (PUT) ---
            res = await fetch(`${API_ROUTES.EVENTS}/${editingEventId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
        } else {
            // --- TẠO MỚI (POST) ---
            res = await fetch(API_ROUTES.EVENTS, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
        }

        if (res.ok) {
            document.getElementById("create-modal").classList.add("hidden");
            loadEvents(); // Reload list
            if (editingEventId) alert("Cập nhật thành công!");
        } else {
            const data = await res.json();
            alert("Lỗi: " + (data.msg || "Thất bại"));
        }
    } catch (err) {
        console.error(err);
        alert("Lỗi kết nối Server");
    }
};

// Xóa sự kiện
window.deleteEvent = async (e, id) => {
    e.stopPropagation();
    if (
        !confirm(
            "CẢNH BÁO: Hành động này sẽ xóa sự kiện và toàn bộ tin nhắn. Bạn chắc chắn chứ?",
        )
    )
        return;

    try {
        await fetch(`${API_ROUTES.EVENTS}/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        socket.emit("admin-delete-event", id);
        loadEvents();
        closeModal();
    } catch (err) {
        console.error(err);
    }
};

// --- PHẦN 2: XEM TIN NHẮN (SOCKET) ---

const modal = document.getElementById("chat-modal");
const modalContent = document.getElementById("modal-chat-content");
let currentViewingId = null;

window.openModal = (id, name) => {
    currentViewingId = id;
    document.getElementById("modal-title").innerText = name;
    modalContent.innerHTML =
        "<p class='text-center text-gray-400'>Đang tải lịch sử...</p>";
    modal.classList.add("modal-active");

    // Gửi yêu cầu lấy lịch sử
    socket.emit("join-event", { eventId: id });
};

window.closeModal = () => {
    modal.classList.remove("modal-active");
    currentViewingId = null;
};

function appendMsgToModal(msg) {
    const div = document.createElement("div");
    div.className =
        "bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col";

    let timeStr = "";
    try {
        timeStr = new Date(msg.createdAt).toLocaleTimeString();
    } catch (e) {}

    div.innerHTML = `
        <span class="font-bold text-indigo-600 text-xs mb-1">${msg.username} <span class="font-normal text-gray-400">(${timeStr})</span></span>
        <span class="text-slate-700">${msg.text}</span>
    `;
    modalContent.appendChild(div);
    modalContent.scrollTop = modalContent.scrollHeight;
}

// Socket Listeners
socket.on("admin-new-message", (msg) => {
    if (!eventsMessages[msg.eventId]) eventsMessages[msg.eventId] = [];
    eventsMessages[msg.eventId].push(msg);

    if (currentViewingId === msg.eventId) {
        const emptyText = modalContent.querySelector("p.italic");
        if (emptyText) emptyText.remove();
        appendMsgToModal(msg);
    }
});

socket.on("chat-history", (msgs) => {
    modalContent.innerHTML = "";
    if (!msgs || msgs.length === 0) {
        modalContent.innerHTML =
            "<p class='text-center text-gray-400 italic'>Chưa có tin nhắn nào</p>";
        return;
    }

    const eventId = msgs[0].eventId;
    eventsMessages[eventId] = msgs;

    if (currentViewingId === eventId) {
        msgs.forEach(appendMsgToModal);
    }
});

// Khởi chạy
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Admin Ready");
    loadEvents();
});
