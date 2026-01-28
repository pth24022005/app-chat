import { API_ROUTES, SOCKET_EVENTS, CHAT_SERVICE_URL } from "./config.js";
import { request, requireAuth, logout } from "./auth.js";

const user = requireAuth("admin");
const socket = io(CHAT_SERVICE_URL, {
    auth: { token: localStorage.getItem("accessToken") },
});

// Hàm format ngày tháng (Để luôn ở đây cho tiện)
function formatDate(dateString) {
    if (!dateString) return "Chưa có lịch";
    return new Date(dateString).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

let allEvents = [];
let editingId = null;
let viewingId = null;

// Load sự kiện
async function loadEvents() {
    const data = await request(API_ROUTES.EVENTS);
    if (data) {
        allEvents = data;
        const grid = document.getElementById("event-grid");
        grid.innerHTML = "";

        data.forEach((evt) => {
            const div = document.createElement("div");
            div.className =
                "bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition flex flex-col justify-between";
            div.innerHTML = `
                <div>
                    <span class="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold uppercase">${evt.category || "Event"}</span>
                    <h3 class="font-bold text-lg mt-2">${evt.name}</h3>
                    <p class="text-xs text-gray-500 mb-2">📅 ${formatDate(evt.startDate)} | 📍 ${evt.location || "Online"}</p>
                    <p class="text-sm text-gray-500 line-clamp-2">${evt.description || ""}</p>
                </div>
                <div class="border-t pt-3 mt-4 flex justify-between">
                    <button class="text-indigo-600 text-xs font-bold btn-chat">Xem Chat</button>
                    <div class="flex gap-2">
                        <button class="text-blue-500 text-xs font-bold btn-edit">Sửa</button>
                        <button class="text-red-500 text-xs font-bold btn-delete">Xóa</button>
                    </div>
                </div>
            `;
            // Gắn sự kiện click
            div.querySelector(".btn-chat").onclick = () =>
                openChat(evt._id, evt.name);
            div.querySelector(".btn-edit").onclick = () => openEdit(evt._id);
            div.querySelector(".btn-delete").onclick = () =>
                deleteEvent(evt._id);
            grid.appendChild(div);
        });
    }
}

// Chức năng CRUD
function openEdit(id) {
    editingId = id;
    const evt = allEvents.find((e) => e._id === id);
    document.getElementById("modal-form-title").innerText = "Cập nhật sự kiện";
    document.getElementById("new-event-name").value = evt.name;
    document.getElementById("new-event-desc").value = evt.description;
    document.getElementById("new-event-location").value = evt.location;
    document.getElementById("create-modal").classList.remove("hidden");
}

async function saveEvent() {
    const payload = {
        name: document.getElementById("new-event-name").value,
        description: document.getElementById("new-event-desc").value,
        location: document.getElementById("new-event-location").value,
        startDate: document.getElementById("new-event-date").value,
        category: document.getElementById("new-event-category").value,
        username: user.username,
    };
    const url = editingId
        ? `${API_ROUTES.EVENTS}/${editingId}`
        : API_ROUTES.EVENTS;
    const method = editingId ? "PUT" : "POST";

    await request(url, method, payload);
    document.getElementById("create-modal").classList.add("hidden");
    loadEvents();
}

async function deleteEvent(id) {
    if (confirm("Xóa sự kiện này?")) {
        await request(`${API_ROUTES.EVENTS}/${id}`, "DELETE");
        socket.emit(SOCKET_EVENTS.ADMIN_DELETE_EVENT, id);
        loadEvents();
    }
}

// Chức năng Chat
function openChat(id, name) {
    viewingId = id;
    document.getElementById("modal-title").innerText = name;
    document.getElementById("modal-chat-content").innerHTML = "";
    document.getElementById("chat-modal").classList.add("flex"); // class flex để hiện
    document.getElementById("chat-modal").classList.remove("hidden");
    socket.emit(SOCKET_EVENTS.JOIN_EVENT, {
        eventId: id,
        role: "admin",
        username: "Admin",
    });
}

socket.on(SOCKET_EVENTS.CHAT_HISTORY, (msgs) => {
    if (msgs.length > 0 && msgs[0].eventId === viewingId) {
        msgs.forEach((msg) => appendMsg(msg));
    }
});
socket.on(SOCKET_EVENTS.ADMIN_NEW_MESSAGE, (msg) => {
    if (msg.eventId === viewingId) appendMsg(msg);
});

function appendMsg(msg) {
    const div = document.createElement("div");
    div.className = "bg-white p-2 rounded border mb-2 text-sm";
    div.innerHTML = `<b>${msg.username}:</b> ${msg.text}`;
    document.getElementById("modal-chat-content").appendChild(div);
}

// Init
loadEvents();
document.getElementById("btn-logout").onclick = logout;
document.getElementById("btn-open-create").onclick = () => {
    editingId = null;
    document.getElementById("modal-form-title").innerText = "Tạo mới";
    document.getElementById("create-modal").classList.remove("hidden");
};
document.getElementById("btn-save-event").onclick = saveEvent;
document.getElementById("btn-cancel-create").onclick = () =>
    document.getElementById("create-modal").classList.add("hidden");
document.getElementById("btn-close-chat").onclick = () =>
    document.getElementById("chat-modal").classList.add("hidden");
