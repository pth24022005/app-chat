import { API_ROUTES } from "../config.js";
import { request } from "../services/api.js";
import { requireAuth, logout } from "../services/authService.js";
import { getSocket } from "../services/socketService.js";
import {
    formatDate,
    getBadgeColor,
    stringToColor,
    formatTime,
} from "../utils/formatters.js";

// 1. Auth & Socket
const user = requireAuth();
const socket = getSocket();

document.getElementById("userInfo").innerText = user.username;

// 2. State
let allEventsCache = [];
let currentEventId = null;
const displayInput = document.getElementById("displayName");
displayInput.value = localStorage.getItem("displayName") || user.username;

// --- LOAD EVENTS ---
async function loadEvents() {
    try {
        const events = await request(API_ROUTES.EVENTS);
        allEventsCache = events || [];
        renderList(events);
    } catch (err) {
        console.error(err);
    }
}

function renderList(events) {
    const listContainer = document.getElementById("event-list");
    listContainer.innerHTML = "";

    if (!events || events.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-400 text-xs mt-10">Chưa có sự kiện nào</p>`;
        return;
    }

    events.forEach((evt) => {
        const dateStr = formatDate(evt.startDate);
        const badgeClass = getBadgeColor(evt.category);

        const btn = document.createElement("button");
        btn.className =
            "w-full bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:shadow-lg transition text-left group relative overflow-hidden mb-2";

        btn.innerHTML = `
            <div class="absolute inset-y-0 left-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="flex justify-between items-start mb-1">
                <span class="text-[10px] ${badgeClass} px-2 py-0.5 rounded font-bold uppercase">${evt.category || "Event"}</span>
                <span class="text-[10px] text-gray-400">Join ➔</span>
            </div>
            <h3 class="font-bold text-gray-700 group-hover:text-indigo-600 transition text-sm mb-1">${evt.name}</h3>
            <div class="text-[11px] text-gray-500 flex flex-col gap-0.5">
                <p>📅 ${dateStr}</p>
                <p>📍 ${evt.location || "Online"}</p>
            </div>
        `;

        // Gắn sự kiện Join
        btn.addEventListener("click", () => joinEvent(evt._id));
        listContainer.appendChild(btn);
    });
}

// --- JOIN ROOM ---
function joinEvent(eventId) {
    const displayName = displayInput.value.trim();
    if (!displayName) {
        alert("Nhập tên hiển thị trước nhé!");
        displayInput.focus();
        return;
    }

    const evt = allEventsCache.find((x) => x._id === eventId);
    if (!evt) return;

    localStorage.setItem("displayName", displayName);
    currentEventId = eventId;

    // Join Socket
    socket.emit("join-event", {
        username: displayName,
        eventId: eventId,
        role: user.role,
    });

    // UI Updates
    document.getElementById("join-screen").classList.add("hidden");
    document.getElementById("chat-screen").classList.remove("hidden");

    document.getElementById("room-name-display").innerText = evt.name;
    const timeStr = formatTime(evt.startDate);
    document.getElementById("room-info-display").innerText =
        `📍 ${evt.location || "Online"} • ⏰ ${timeStr}`;

    document.getElementById("chat-content").innerHTML = "";
    document.getElementById("online-count").innerText = "0";
}

function leaveEvent() {
    if (confirm("Rời phòng chat?")) window.location.reload();
}

// --- CHAT LOGIC ---
function sendMessage() {
    const msgInput = document.getElementById("message-input");
    const text = msgInput.value.trim();
    if (!text) return;
    socket.emit("chat-message", text);
    msgInput.value = "";
    msgInput.focus();
}

function renderMessage(msg) {
    const chatContent = document.getElementById("chat-content");
    const isMe = msg.username === displayInput.value.trim();

    const wrapper = document.createElement("div");
    wrapper.className = `flex gap-2 mb-3 animate-fade-in ${isMe ? "flex-row-reverse" : "flex-row"}`;

    // Avatar
    const firstLetter = msg.username.charAt(0).toUpperCase();
    const bgColor = isMe ? "#4F46E5" : stringToColor(msg.username);

    const avatar = document.createElement("div");
    avatar.className =
        "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm";
    avatar.style.backgroundColor = bgColor;
    avatar.innerText = firstLetter;

    // Bubble
    const contentDiv = document.createElement("div");
    contentDiv.className = `flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`;

    let nameHtml = !isMe
        ? `<span class="text-[10px] text-gray-500 mb-0.5 ml-1">${msg.username}</span>`
        : "";
    let timeStr = formatTime(msg.createdAt);

    contentDiv.innerHTML = `
        ${nameHtml}
        <div class="px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}">
            ${msg.text}
        </div>
        <span class="text-[9px] text-gray-300 mt-1 mx-1">${timeStr}</span>
    `;

    wrapper.appendChild(avatar);
    wrapper.appendChild(contentDiv);
    chatContent.appendChild(wrapper);
    chatContent.scrollTop = chatContent.scrollHeight;
}

// --- LISTENERS ---
socket.on("chat-history", (msgs) => {
    document.getElementById("chat-content").innerHTML = "";
    msgs.forEach(renderMessage);
});
socket.on("chat-message", renderMessage);
socket.on(
    "update-user-count",
    (c) => (document.getElementById("online-count").innerText = c),
);
socket.on("admin-event-deleted", (id) => {
    if (currentEventId === id) {
        alert("Admin đã xóa sự kiện này.");
        window.location.reload();
    }
});

// --- INIT ---
loadEvents();

document.getElementById("btn-logout").addEventListener("click", logout);
document.getElementById("btn-leave").addEventListener("click", leaveEvent);
document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("message-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
});
