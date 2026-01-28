// client/public/js/admin.js

// 1. Kiểm tra quyền Admin
const user = requireAuth("admin");
if (!user) throw new Error("Unauthorized");

// 2. Kết nối Socket
const socket = io();
socket.emit("join-event", { role: "admin" });

// Biến lưu trữ tạm tin nhắn để hiển thị trong Modal
let eventsMessages = {};

// --- PHẦN 1: QUẢN LÝ SỰ KIỆN (API) ---

// Load danh sách sự kiện từ Server
async function loadEvents() {
    try {
        const res = await fetch(API_ROUTES.EVENTS);
        const events = await res.json();
        renderEvents(events);
    } catch (err) {
        console.error("Lỗi tải sự kiện:", err);
    }
}

// Render ra giao diện
function renderEvents(events) {
    const grid = document.getElementById("event-grid");
    grid.innerHTML = "";

    events.forEach((evt) => {
        const div = document.createElement("div");
        div.className =
            "bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition relative group cursor-pointer";

        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-lg text-slate-800 line-clamp-1" title="${evt.name}">${evt.name}</h3>
                <span class="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">ACTIVE</span>
            </div>
            <p class="text-sm text-slate-500 mb-4 h-10 line-clamp-2">${evt.description || "Không có mô tả"}</p>
            
            <div class="flex justify-between items-center border-t pt-3 mt-2">
                <button onclick="openModal('${evt._id}', '${evt.name}')" class="text-indigo-600 text-xs font-bold hover:underline">Xem Chat</button>
                <button onclick="deleteEvent(event, '${evt._id}')" class="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition">
                    🗑 Xóa
                </button>
            </div>
        `;
        grid.appendChild(div);
    });
}

// Tạo sự kiện mới
async function createNewEvent() {
    const name = document.getElementById("new-event-name").value;
    const desc = document.getElementById("new-event-desc").value;

    if (!name) return alert("Vui lòng nhập tên sự kiện!");

    try {
        const res = await fetch(API_ROUTES.EVENTS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                description: desc,
                username: user.username,
            }),
        });

        if (res.ok) {
            // Reset form
            document.getElementById("new-event-name").value = "";
            document.getElementById("new-event-desc").value = "";
            document.getElementById("create-modal").classList.add("hidden");
            loadEvents(); // Reload lại list
        } else {
            alert("Lỗi tạo sự kiện");
        }
    } catch (err) {
        console.error(err);
    }
}

// Xóa sự kiện
async function deleteEvent(e, id) {
    e.stopPropagation(); // Ngăn click nhầm vào card
    if (
        !confirm(
            "CẢNH BÁO: Hành động này sẽ xóa sự kiện và toàn bộ tin nhắn. Bạn chắc chắn chứ?",
        )
    )
        return;

    try {
        await fetch(`${API_ROUTES.EVENTS}/${id}`, { method: "DELETE" });

        // Gửi socket để User bên phía Client biết mà tự thoát ra
        socket.emit("admin-delete-event", id);

        loadEvents();
        closeModal(); // Nếu đang mở modal chat của event này thì đóng lại
    } catch (err) {
        console.error(err);
    }
}

// --- PHẦN 2: XEM TIN NHẮN (SOCKET & MODAL) ---

const modal = document.getElementById("chat-modal");
const modalContent = document.getElementById("modal-chat-content");
let currentViewingId = null;

// Mở modal xem chat
window.openModal = (id, name) => {
    currentViewingId = id;
    document.getElementById("modal-title").innerText = name;
    modalContent.innerHTML =
        "<p class='text-center text-gray-400'>Đang tải lịch sử...</p>";
    modal.classList.add("modal-active");

    // Yêu cầu server gửi lịch sử chat của event này (nếu muốn làm kỹ hơn)
    // Ở đây ta tạm thời hứng realtime message hoặc hiển thị mảng đã lưu
    renderModalChat(id);
};

window.closeModal = () => {
    modal.classList.remove("modal-active");
    currentViewingId = null;
};

// Render tin nhắn trong modal
function renderModalChat(eventId) {
    modalContent.innerHTML = "";
    const msgs = eventsMessages[eventId] || [];

    if (msgs.length === 0) {
        modalContent.innerHTML =
            "<p class='text-center text-gray-400 italic'>Chưa có tin nhắn nào</p>";
        return;
    }

    msgs.forEach(appendMsgToModal);
}

function appendMsgToModal(msg) {
    const div = document.createElement("div");
    div.className =
        "bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col";
    div.innerHTML = `
        <span class="font-bold text-indigo-600 text-xs mb-1">${msg.username} <span class="font-normal text-gray-400">(${new Date(msg.createdAt).toLocaleTimeString()})</span></span>
        <span class="text-slate-700">${msg.text}</span>
    `;
    modalContent.appendChild(div);
    modalContent.scrollTop = modalContent.scrollHeight;
}

// --- SOCKET LISTENERS ---

// 1. Nhận tin nhắn mới từ bất kỳ phòng nào
socket.on("admin-new-message", (msg) => {
    // Lưu vào bộ nhớ tạm
    if (!eventsMessages[msg.eventId]) eventsMessages[msg.eventId] = [];
    eventsMessages[msg.eventId].push(msg);

    // Nếu đang mở modal của đúng event đó thì hiện lên luôn
    if (currentViewingId === msg.eventId) {
        // Xóa chữ "Chưa có tin nhắn" nếu có
        const emptyText = modalContent.querySelector("p.italic");
        if (emptyText) emptyText.remove();

        appendMsgToModal(msg);
    }
});

// 2. Nhận toàn bộ tin nhắn khi vừa vào (Optional, nếu Server gửi)
socket.on("admin-all-messages", (allMsgs) => {
    eventsMessages = {}; // Reset
    allMsgs.forEach((msg) => {
        if (!eventsMessages[msg.eventId]) eventsMessages[msg.eventId] = [];
        eventsMessages[msg.eventId].push(msg);
    });
});

// Khởi chạy
loadEvents();
