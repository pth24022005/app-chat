import { API_ROUTES, SOCKET_EVENTS, CHAT_SERVICE_URL } from "./config.js";
import { request, requireAuth, logout } from "./auth.js";

// --- 1. SETUP & AUTH ---
const user = requireAuth();
const socket = io(CHAT_SERVICE_URL, {
    auth: { token: localStorage.getItem("accessToken") },
    transports: ["websocket"],
});

// UI Elements
const ui = {
    displayName: document.getElementById("displayName"),
    eventList: document.getElementById("event-list"),
    chatScreen: document.getElementById("chat-screen"),
    joinScreen: document.getElementById("join-screen"),
    chatContent: document.getElementById("chat-content"),
    msgInput: document.getElementById("message-input"),
    sendBtn: document.getElementById("send-btn"),
    onlineCount: document.getElementById("online-count"),
    roomName: document.getElementById("room-name-display"),
    roomInfo: document.getElementById("room-info-display"),
};

// Hiển thị tên User
document.getElementById("userInfo").innerText = user.username;
ui.displayName.value = localStorage.getItem("displayName") || user.username;

let currentEventId = null;

// --- 2. HELPER FUNCTIONS (Đã đưa vào đây để không bị lỗi import) ---

// Hàm format giờ (Ví dụ: 14:30)
function formatTime(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Hàm tạo màu avatar từ tên
function getAvatarColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

// --- 3. MAIN LOGIC ---

// Tải danh sách phòng
async function loadEvents() {
    try {
        const events = await request(API_ROUTES.EVENTS);
        ui.eventList.innerHTML = "";

        if (!events || events.length === 0) {
            ui.eventList.innerHTML = `<p class="text-center text-gray-400 text-xs mt-4">Chưa có sự kiện nào</p>`;
            return;
        }

        events.forEach((evt) => {
            const btn = document.createElement("button");
            btn.className =
                "w-full bg-white p-4 rounded-xl border hover:border-indigo-500 mb-2 text-left shadow-sm group transition-all";
            btn.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">${evt.category || "Event"}</span>
                    <span class="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition">Tham gia ➔</span>
                </div>
                <h3 class="font-bold text-gray-700 text-sm group-hover:text-indigo-700">${evt.name}</h3>
                <p class="text-[11px] text-gray-400 mt-1">📍 ${evt.location || "Online"}</p>
            `;
            btn.onclick = () => joinEvent(evt);
            ui.eventList.appendChild(btn);
        });
    } catch (e) {
        console.error(e);
    }
}

// Vào phòng chat
function joinEvent(evt) {
    const name = ui.displayName.value.trim();
    if (!name) return alert("Vui lòng nhập tên hiển thị!");

    localStorage.setItem("displayName", name);
    currentEventId = evt._id;

    // Gửi event Join
    socket.emit(SOCKET_EVENTS.JOIN_EVENT, {
        username: name,
        eventId: evt._id,
        role: user.role,
    });

    // Chuyển màn hình
    ui.joinScreen.classList.add("hidden");
    ui.chatScreen.classList.remove("hidden");
    ui.chatScreen.classList.add("flex");

    // Update Header
    ui.roomName.innerText = evt.name;
    ui.roomInfo.innerText = `📍 ${evt.location || "Online"}`;

    // Reset Chat Box
    ui.chatContent.innerHTML = "";
    const seenContainer = document.createElement("div");
    seenContainer.id = "seen-status-container";
    seenContainer.className = "flex justify-end gap-1 px-4 pb-2";
    ui.chatContent.appendChild(seenContainer);
}

// Gửi tin nhắn
function sendMessage() {
    const text = ui.msgInput.value.trim();
    if (!text) return;

    socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, text);
    ui.msgInput.value = "";
    ui.msgInput.focus();
}

// Render 1 tin nhắn
function renderMessage(msg) {
    const myName = ui.displayName.value;
    const isMe = msg.username === myName;

    // Wrapper tin nhắn
    const div = document.createElement("div");
    div.className = `flex gap-2 mb-3 animate-fade-in ${isMe ? "flex-row-reverse" : "flex-row"}`;

    // Avatar
    const avatar = document.createElement("div");
    avatar.className =
        "w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm border border-white";
    avatar.style.backgroundColor = isMe
        ? "#4F46E5"
        : getAvatarColor(msg.username);
    avatar.innerText = msg.username.charAt(0).toUpperCase();

    // Nội dung + Thời gian
    const content = document.createElement("div");
    content.className = `flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`;

    const timeStr = formatTime(msg.createdAt);

    content.innerHTML = `
        ${!isMe ? `<span class="text-[10px] text-gray-500 ml-1 mb-0.5">${msg.username}</span>` : ""}
        <div class="px-3 py-2 rounded-2xl text-sm shadow-sm break-words relative group ${
            isMe
                ? "bg-indigo-600 text-white rounded-tr-none"
                : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
        }">
            ${msg.text}
            <div class="hidden group-hover:block absolute -bottom-5 ${isMe ? "right-0" : "left-0"} text-[9px] text-gray-400 bg-white px-1 rounded shadow whitespace-nowrap z-10 border">
                ${timeStr}
            </div>
        </div>
        <span class="text-[9px] text-gray-300 mt-1 mx-1 select-none">${timeStr}</span>
    `;

    div.appendChild(avatar);
    div.appendChild(content);

    const seenBox = document.getElementById("seen-status-container");
    if (seenBox) ui.chatContent.insertBefore(div, seenBox);
    else ui.chatContent.appendChild(div);

    scrollToBottom();
}

// Render Avatar "Đã xem"
function renderSeenStatus(users = []) {
    const container = document.getElementById("seen-status-container");
    if (!container) return;
    container.innerHTML = "";

    users.forEach((u) => {
        if (u === ui.displayName.value) return;
        const img = document.createElement("div");
        img.className =
            "w-4 h-4 rounded-full border border-white shadow-sm text-[8px] flex items-center justify-center text-white";
        img.style.backgroundColor = getAvatarColor(u);
        img.innerText = u.charAt(0).toUpperCase();
        img.title = `Đã xem bởi ${u}`;
        container.appendChild(img);
    });
    scrollToBottom();
}

function scrollToBottom() {
    ui.chatContent.scrollTop = ui.chatContent.scrollHeight;
}

// --- 4. EVENT LISTENERS ---

ui.msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

ui.sendBtn.addEventListener("click", sendMessage);
document
    .getElementById("btn-leave")
    .addEventListener("click", () => window.location.reload());
document.getElementById("btn-logout").addEventListener("click", logout);

// --- 5. SOCKET LISTENERS ---

socket.on(SOCKET_EVENTS.CHAT_HISTORY, (msgs) => {
    const seenBox = document.getElementById("seen-status-container");
    ui.chatContent.innerHTML = "";
    if (seenBox) ui.chatContent.appendChild(seenBox);
    else {
        const div = document.createElement("div");
        div.id = "seen-status-container";
        div.className = "flex justify-end gap-1 px-4 pb-2";
        ui.chatContent.appendChild(div);
    }
    msgs.forEach(renderMessage);
});

socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg) => {
    renderMessage(msg);
    renderSeenStatus([]);
});

socket.on(SOCKET_EVENTS.UPDATE_USER_COUNT, (count) => {
    ui.onlineCount.innerText = count;
});

socket.on("message-seen", (usersRead) => {
    renderSeenStatus(usersRead);
});

// --- INIT ---
loadEvents();
