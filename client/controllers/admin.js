import { API_ROUTES } from "../config.js";
import { request } from "../services/api.js";
import { requireAuth, logout } from "../services/authService.js";
import { getSocket } from "../services/socketService.js";
import { formatDate, getBadgeColor } from "../utils/formatters.js";

// 1. Check Auth
const user = requireAuth("admin");
if (!user) throw new Error("Unauthorized");

// 2. Init Socket
const socket = getSocket();
socket.emit("join-event", {
    role: "admin",
    username: user.username,
    eventId: "admin-room",
});

// Biến toàn cục
let eventsMessages = {};
let allEventsCache = [];
let editingEventId = null;
let currentViewingId = null;

// --- DOM ELEMENTS ---
const modalCreate = document.getElementById("create-modal");
const modalChat = document.getElementById("chat-modal");
const modalChatContent = document.getElementById("modal-chat-content");

// --- LOGIC: EVENTS CRUD ---

async function loadEvents() {
    try {
        const events = await request(API_ROUTES.EVENTS);
        if (events) {
            allEventsCache = events;
            renderEvents(events);
        }
    } catch (err) {
        console.error(err);
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
        const dateStr = formatDate(evt.startDate);
        const badgeClass = getBadgeColor(evt.category);

        const div = document.createElement("div");
        div.className =
            "bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition relative group cursor-pointer flex flex-col justify-between";

        div.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] ${badgeClass} px-2 py-1 rounded font-bold uppercase tracking-wider">${evt.category || "Event"}</span>
                    <span class="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">ACTIVE</span>
                </div>
                <h3 class="font-bold text-lg text-slate-800 line-clamp-1 mb-1">${evt.name}</h3>
                <div class="text-xs text-gray-500 mb-3 flex flex-col gap-1">
                    <p>📅 ${dateStr}</p>
                    <p>📍 ${evt.location || "Online"}</p>
                </div>
                <p class="text-sm text-slate-500 mb-4 h-10 line-clamp-2">${evt.description || "Không có mô tả"}</p>
            </div>
            <div class="flex justify-between items-center border-t pt-3 mt-auto action-buttons">
                </div>
        `;

        // Tạo nút View Chat
        const btnChat = document.createElement("button");
        btnChat.className = "text-indigo-600 text-xs font-bold hover:underline";
        btnChat.innerText = "Xem Chat";
        btnChat.onclick = () => openChatModal(evt._id, evt.name);

        // Tạo nút Sửa
        const btnEdit = document.createElement("button");
        btnEdit.className =
            "text-blue-500 hover:text-blue-700 p-1 text-xs font-bold ml-auto mr-2";
        btnEdit.innerText = "✏️ Sửa";
        btnEdit.onclick = (e) => {
            e.stopPropagation();
            openEditForm(evt._id);
        };

        // Tạo nút Xóa
        const btnDelete = document.createElement("button");
        btnDelete.className =
            "text-red-400 hover:text-red-600 p-1 text-xs font-bold";
        btnDelete.innerText = "🗑 Xóa";
        btnDelete.onclick = (e) => deleteEvent(e, evt._id);

        const actionDiv = div.querySelector(".action-buttons");
        actionDiv.appendChild(btnChat);
        actionDiv.appendChild(btnEdit);
        actionDiv.appendChild(btnDelete);

        grid.appendChild(div);
    });
}

// --- LOGIC: FORM (CREATE/EDIT) ---

function openCreateForm() {
    editingEventId = null;
    document.getElementById("modal-form-title").innerText = "Tạo sự kiện mới";
    document.getElementById("btn-save-event").innerText = "Tạo ngay";

    // Reset inputs
    document.getElementById("new-event-name").value = "";
    document.getElementById("new-event-desc").value = "";
    document.getElementById("new-event-location").value = "";
    document.getElementById("new-event-date").value = "";

    modalCreate.classList.remove("hidden");
}

function openEditForm(id) {
    const evt = allEventsCache.find((x) => x._id === id);
    if (!evt) return;

    editingEventId = id;
    document.getElementById("modal-form-title").innerText = "Cập nhật sự kiện";
    document.getElementById("btn-save-event").innerText = "Lưu thay đổi";

    document.getElementById("new-event-name").value = evt.name;
    document.getElementById("new-event-desc").value = evt.description || "";
    document.getElementById("new-event-location").value = evt.location || "";
    document.getElementById("new-event-category").value =
        evt.category || "Hội thảo";

    if (evt.startDate) {
        const d = new Date(evt.startDate);
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = new Date(d - offset).toISOString().slice(0, 16);
        document.getElementById("new-event-date").value = localISOTime;
    }

    modalCreate.classList.remove("hidden");
}

async function handleSaveEvent() {
    const name = document.getElementById("new-event-name").value;
    const desc = document.getElementById("new-event-desc").value;
    const startDate = document.getElementById("new-event-date").value;
    const location = document.getElementById("new-event-location").value;
    const category = document.getElementById("new-event-category").value;

    if (!name || !startDate) return alert("Vui lòng nhập đủ thông tin!");

    const payload = {
        name,
        description: desc,
        startDate,
        location,
        category,
        username: user.username,
    };
    const method = editingEventId ? "PUT" : "POST";
    const url = editingEventId
        ? `${API_ROUTES.EVENTS}/${editingEventId}`
        : API_ROUTES.EVENTS;

    try {
        const res = await request(url, method, payload);
        if (res) {
            modalCreate.classList.add("hidden");
            loadEvents();
            if (editingEventId) alert("Cập nhật thành công!");
        }
    } catch (err) {
        alert(err.message);
    }
}

async function deleteEvent(e, id) {
    e.stopPropagation();
    if (!confirm("Chắc chắn xóa sự kiện này?")) return;

    try {
        await request(`${API_ROUTES.EVENTS}/${id}`, "DELETE");
        socket.emit("admin-delete-event", id);
        loadEvents();
        closeChatModal();
    } catch (err) {
        alert(err.message);
    }
}

// --- LOGIC: CHAT MODAL ---

function openChatModal(id, name) {
    currentViewingId = id;
    document.getElementById("modal-title").innerText = name;
    modalChatContent.innerHTML =
        "<p class='text-center text-gray-400'>Đang tải...</p>";
    modalChat.classList.add("modal-active");
    socket.emit("join-event", {
        eventId: id,
        role: "admin",
        username: "Admin",
    });
}

function closeChatModal() {
    modalChat.classList.remove("modal-active");
    currentViewingId = null;
}

function appendMsgToModal(msg) {
    const div = document.createElement("div");
    div.className =
        "bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col mb-2";

    let timeStr = "";
    try {
        timeStr = new Date(msg.createdAt).toLocaleTimeString();
    } catch (e) {}

    div.innerHTML = `
        <span class="font-bold text-indigo-600 text-xs mb-1">${msg.username} <span class="font-normal text-gray-400">(${timeStr})</span></span>
        <span class="text-slate-700">${msg.text}</span>
    `;
    modalChatContent.appendChild(div);
    modalChatContent.scrollTop = modalChatContent.scrollHeight;
}

// --- SOCKET LISTENERS ---
socket.on("admin-new-message", (msg) => {
    if (currentViewingId === msg.eventId) {
        const emptyText = modalChatContent.querySelector("p.text-center");
        if (emptyText) emptyText.remove();
        appendMsgToModal(msg);
    }
});

socket.on("chat-history", (msgs) => {
    modalChatContent.innerHTML = "";
    if (!msgs || msgs.length === 0) {
        modalChatContent.innerHTML =
            "<p class='text-center text-gray-400 italic'>Chưa có tin nhắn nào</p>";
        return;
    }
    const eventId = msgs[0].eventId;
    if (currentViewingId === eventId) msgs.forEach(appendMsgToModal);
});

// --- INITIALIZE & EVENT BINDING ---
document.addEventListener("DOMContentLoaded", () => {
    loadEvents();

    // Gán sự kiện cho các nút tĩnh
    document.getElementById("btn-logout").addEventListener("click", logout);
    document
        .getElementById("btn-open-create")
        .addEventListener("click", openCreateForm);
    document
        .getElementById("btn-save-event")
        .addEventListener("click", handleSaveEvent);
    document
        .getElementById("btn-cancel-create")
        .addEventListener("click", () => modalCreate.classList.add("hidden"));
    document
        .getElementById("btn-close-chat")
        .addEventListener("click", closeChatModal);
});
