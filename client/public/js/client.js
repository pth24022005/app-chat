// client/public/js/client.js

// 1. Check Auth
const user = requireAuth();
if (!user) throw new Error("Unauthorized");

document.getElementById("userInfo").innerText = user.username;

// 2. Kết nối Socket
const token = localStorage.getItem("token");
const socket = io(CHAT_SERVICE_URL, {
    auth: { token: token },
});

const displayInput = document.getElementById("displayName");
displayInput.value = localStorage.getItem("displayName") || user.username;

let currentEventId = null;
let allEventsCache = [];

// --- PHẦN 1: LIST SỰ KIỆN ---

async function loadEvents() {
    try {
        const res = await fetch(API_ROUTES.EVENTS);
        const events = await res.json();
        allEventsCache = events;

        const listContainer = document.getElementById("event-list");
        listContainer.innerHTML = "";

        if (events.length === 0) {
            listContainer.innerHTML = `<p class="text-center text-gray-400 text-xs mt-10">Chưa có sự kiện nào</p>`;
            return;
        }

        events.forEach((evt) => {
            const btn = document.createElement("button");
            btn.className =
                "w-full bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:shadow-lg transition text-left group relative overflow-hidden mb-2";

            let dateStr = evt.startDate
                ? new Date(evt.startDate).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                  })
                : "Chưa có lịch";

            let badgeColor = "bg-indigo-100 text-indigo-700";
            if (evt.category === "Giải trí")
                badgeColor = "bg-pink-100 text-pink-700";
            if (evt.category === "Học tập")
                badgeColor = "bg-yellow-100 text-yellow-700";
            if (evt.category === "Họp nội bộ")
                badgeColor = "bg-gray-100 text-gray-700";

            btn.onclick = () => joinEvent(evt._id);

            btn.innerHTML = `
                <div class="absolute inset-y-0 left-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="flex justify-between items-start mb-1">
                    <span class="text-[10px] ${badgeColor} px-2 py-0.5 rounded font-bold uppercase">${evt.category || "Event"}</span>
                    <span class="text-[10px] text-gray-400">Join ➔</span>
                </div>
                <h3 class="font-bold text-gray-700 group-hover:text-indigo-600 transition text-sm mb-1">${evt.name}</h3>
                <div class="text-[11px] text-gray-500 flex flex-col gap-0.5">
                    <p>📅 ${dateStr}</p>
                    <p>📍 ${evt.location || "Online"}</p>
                </div>
            `;
            listContainer.appendChild(btn);
        });
    } catch (err) {
        console.error("Lỗi tải sự kiện", err);
    }
}

loadEvents();

// --- PHẦN 2: THAM GIA SỰ KIỆN ---

function joinEvent(eventId) {
    const displayName = displayInput.value.trim();
    if (!displayName) {
        alert("Bạn ơi, nhập tên hiển thị trước nhé!");
        displayInput.focus();
        return;
    }

    const evt = allEventsCache.find((x) => x._id === eventId);
    if (!evt) return;

    localStorage.setItem("displayName", displayName);
    currentEventId = eventId;

    socket.emit("join-event", {
        username: displayName,
        eventId: eventId,
        role: user.role,
    });

    // UI Updates
    document.getElementById("join-screen").classList.add("hidden");
    document.getElementById("chat-screen").classList.remove("hidden");
    document.getElementById("room-name-display").innerText = evt.name;

    let timeStr = evt.startDate
        ? new Date(evt.startDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";
    document.getElementById("room-info-display").innerText =
        `📍 ${evt.location || "Online"} • ⏰ ${timeStr}`;

    // Reset Chat & Count
    document.getElementById("chat-content").innerHTML = "";
    document.getElementById("online-count").innerText = "0";
}

window.leaveEvent = () => {
    if (confirm("Bạn muốn rời phòng chat này?")) window.location.reload();
};

// --- PHẦN 3: CHAT LOGIC ---

const chatContent = document.getElementById("chat-content");
const msgInput = document.getElementById("message-input");

document.getElementById("send-btn").onclick = sendMessage;
msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
});

function sendMessage() {
    const text = msgInput.value.trim();
    if (!text) return;
    socket.emit("chat-message", text);
    msgInput.value = "";
    msgInput.focus();
}

// --- HÀM RENDER TIN NHẮN (CÓ AVATAR) ---

// Tạo màu ngẫu nhiên cố định theo tên
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

function renderMessage(msg) {
    const isMe = msg.username === displayInput.value.trim();
    const wrapper = document.createElement("div");

    // Layout Flex: Đảo ngược chiều nếu là mình
    wrapper.className = `flex gap-2 mb-3 animate-fade-in ${isMe ? "flex-row-reverse" : "flex-row"}`;

    // 1. Tạo Avatar
    const firstLetter = msg.username.charAt(0).toUpperCase();
    const bgColor = stringToColor(msg.username);

    const avatar = document.createElement("div");
    avatar.className =
        "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm";
    avatar.style.backgroundColor = isMe ? "#4F46E5" : bgColor;
    avatar.innerText = firstLetter;

    // 2. Nội dung
    const contentDiv = document.createElement("div");
    contentDiv.className = `flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`;

    let nameHtml = "";
    if (!isMe)
        nameHtml = `<span class="text-[10px] text-gray-500 mb-0.5 ml-1">${msg.username}</span>`;

    const bubble = document.createElement("div");
    bubble.className = `px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${
        isMe
            ? "bg-indigo-600 text-white rounded-tr-none"
            : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
    }`;
    bubble.innerText = msg.text;

    const timeSpan = document.createElement("span");
    timeSpan.className = "text-[9px] text-gray-300 mt-1 mx-1";
    try {
        timeSpan.innerText = new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (e) {}

    contentDiv.innerHTML = nameHtml;
    contentDiv.appendChild(bubble);
    contentDiv.appendChild(timeSpan);

    wrapper.appendChild(avatar);
    wrapper.appendChild(contentDiv);
    chatContent.appendChild(wrapper);
}

function scrollToBottom() {
    chatContent.scrollTop = chatContent.scrollHeight;
}

// --- SOCKET LISTENERS ---

socket.on("chat-history", (msgs) => {
    chatContent.innerHTML = "";
    msgs.forEach(renderMessage);
    scrollToBottom();
});

socket.on("chat-message", (msg) => {
    renderMessage(msg);
    scrollToBottom();
});

// CẬP NHẬT SỐ LƯỢNG NGƯỜI
socket.on("update-user-count", (count) => {
    const countEl = document.getElementById("online-count");
    if (countEl) countEl.innerText = count;
});

socket.on("admin-event-deleted", (deletedId) => {
    if (currentEventId === deletedId) {
        alert("⚠️ Sự kiện này đã kết thúc bởi Admin.");
        window.location.reload();
    }
});
