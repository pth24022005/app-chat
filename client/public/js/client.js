// client/public/js/client.js

// 1. Check Auth
const user = requireAuth();
if (!user) throw new Error("Unauthorized");

document.getElementById("userInfo").innerText = user.username;

const socket = io();
const displayInput = document.getElementById("displayName");

// Load tên cũ nếu có
displayInput.value = localStorage.getItem("displayName") || user.username;

// Biến lưu trạng thái hiện tại
let currentEventId = null;

// --- PHẦN 1: LIST SỰ KIỆN ---

async function loadEvents() {
    try {
        const res = await fetch(API_ROUTES.EVENTS);
        const events = await res.json();
        const listContainer = document.getElementById("event-list");

        listContainer.innerHTML = "";

        if (events.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center mt-10 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p class="text-gray-500 font-bold">Chưa có sự kiện nào</p>
                    <p class="text-xs text-gray-400 mt-1">Vui lòng chờ Admin tạo sự kiện mới</p>
                </div>
            `;
            return;
        }

        events.forEach((evt) => {
            const btn = document.createElement("button");
            btn.className =
                "w-full bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:shadow-lg transition text-left group relative overflow-hidden";

            // Xử lý khi bấm nút Join
            btn.onclick = () => joinEvent(evt._id, evt.name);

            btn.innerHTML = `
                <div class="absolute inset-y-0 left-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="flex justify-between items-center">
                    <span class="font-bold text-gray-700 group-hover:text-indigo-600 transition">${evt.name}</span>
                    <span class="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold group-hover:bg-indigo-600 group-hover:text-white transition">Join ➔</span>
                </div>
                <p class="text-xs text-gray-400 mt-1 truncate">${evt.description || "..."}</p>
            `;
            listContainer.appendChild(btn);
        });
    } catch (err) {
        console.error("Lỗi tải sự kiện", err);
    }
}

// Gọi ngay khi vào trang
loadEvents();

// --- PHẦN 2: THAM GIA SỰ KIỆN ---

function joinEvent(eventId, eventName) {
    const displayName = displayInput.value.trim();
    if (!displayName) {
        alert("Bạn ơi, nhập tên hiển thị trước nhé!");
        displayInput.focus();
        displayInput.classList.add("ring-2", "ring-red-400"); // Hiệu ứng báo lỗi
        setTimeout(
            () => displayInput.classList.remove("ring-2", "ring-red-400"),
            2000,
        );
        return;
    }

    // Lưu thông tin
    localStorage.setItem("displayName", displayName);
    currentEventId = eventId;

    // Socket: Gửi yêu cầu tham gia
    socket.emit("join-event", {
        username: displayName,
        eventId: eventId,
        role: user.role,
    });

    // Cập nhật UI
    document.getElementById("join-screen").classList.add("hidden");
    document.getElementById("chat-screen").classList.remove("hidden");
    document.getElementById("room-name-display").innerText =
        `Phòng: ${eventName}`;

    // Xóa tin nhắn cũ
    document.getElementById("chat-content").innerHTML = "";
}

// Rời phòng (Quay lại danh sách)
window.leaveEvent = () => {
    if (confirm("Bạn muốn rời phòng chat này?")) {
        window.location.reload();
    }
};

// --- PHẦN 3: CHAT & SOCKET ---

const chatContent = document.getElementById("chat-content");
const msgInput = document.getElementById("message-input");

// Gửi tin nhắn
document.getElementById("send-btn").onclick = sendMessage;
msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
});

function sendMessage() {
    const text = msgInput.value.trim();
    if (!text) return;

    // Gửi lên server
    socket.emit("chat-message", text);
    msgInput.value = "";
    msgInput.focus();
}

// --- SOCKET LISTENERS ---

// 1. Nhận lịch sử chat khi vừa vào
socket.on("chat-history", (msgs) => {
    chatContent.innerHTML = "";
    msgs.forEach(renderMessage);
    scrollToBottom();
});

// 2. Nhận tin nhắn mới
socket.on("chat-message", (msg) => {
    renderMessage(msg);
    scrollToBottom();
});

// 3. Thông báo hệ thống (Ai đó đã vào phòng)
socket.on("system-message", (text) => {
    const div = document.createElement("div");
    div.className = "text-center my-3";
    div.innerHTML = `<span class="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full uppercase tracking-wide">${text}</span>`;
    chatContent.appendChild(div);
    scrollToBottom();
});

// 4. Xử lý khi Admin xóa sự kiện
socket.on("admin-event-deleted", (deletedId) => {
    if (currentEventId === deletedId) {
        alert("⚠️ Sự kiện này đã kết thúc bởi Admin.");
        window.location.reload();
    }
});

// Hàm render tin nhắn ra HTML
function renderMessage(msg) {
    const isMe = msg.username === displayInput.value.trim(); // So sánh với tên hiện tại
    const wrapper = document.createElement("div");
    wrapper.className = `flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in`;

    // Nếu là người khác thì hiện tên
    let nameHtml = "";
    if (!isMe) {
        nameHtml = `<span class="text-[10px] font-bold text-gray-500 mb-1 ml-2">${msg.username}</span>`;
    }

    const bubble = document.createElement("div");
    bubble.className = `max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${
        isMe
            ? "bg-indigo-600 text-white rounded-tr-none"
            : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
    }`;
    bubble.innerText = msg.text;

    wrapper.innerHTML = `${nameHtml}`;
    wrapper.appendChild(bubble);

    // Thêm thời gian (Optional)
    const time = document.createElement("span");
    time.className = "text-[9px] text-gray-300 mt-1 mx-1";
    time.innerText = new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
    wrapper.appendChild(time);

    chatContent.appendChild(wrapper);
}

function scrollToBottom() {
    chatContent.scrollTop = chatContent.scrollHeight;
}
