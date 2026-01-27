const socket = io();

// ===== AUTH CHECK =====
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "/login.html";

document.getElementById("userInfo").innerText =
  `${user.username} (${user.role})`;

// ===== LOGOUT =====
document.getElementById("logoutBtn").onclick = () => {
  localStorage.clear();
  window.location.href = "/login.html";
};

const joinScreen = document.getElementById("join");
const chatScreen = document.getElementById("chatBox");
const joinBtn = document.getElementById("joinBtn");
const sendBtn = document.getElementById("sendBtn");
const chatBox = document.getElementById("chat");
const msgInput = document.getElementById("message");
const displayInput = document.getElementById("displayName");

let currentUser = "";

// load display name cũ
displayInput.value =
  localStorage.getItem("displayName") || user.username;

// ===== JOIN EVENT =====
joinBtn.onclick = () => {
  const eventId = document.getElementById("eventId").value.trim();
  const displayName = displayInput.value.trim();

  if (!eventId || !displayName) {
    alert("Vui lòng nhập Event ID và Tên hiển thị");
    return;
  }

  currentUser = displayName;
  localStorage.setItem("displayName", displayName);

  socket.emit("join-event", {
    username: displayName,
    eventId,
    role: user.role,
  });

  joinScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  msgInput.focus();
};

// ===== SEND MESSAGE =====
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  socket.emit("chat-message", text);
  msgInput.value = "";
}

sendBtn.onclick = sendMessage;
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ===== SOCKET =====
socket.on("chat-history", (messages) => {
  chatBox.innerHTML = "";
  messages.forEach(renderMessage);
});

socket.on("chat-message", renderMessage);

socket.on("system-message", (text) => {
  const div = document.createElement("div");
  div.className =
    "text-center text-[10px] uppercase text-gray-400 my-2";
  div.innerText = text;
  chatBox.appendChild(div);
  scrollToBottom();
});

// ===== RENDER =====
function renderMessage(msg) {
  const isMe = msg.username === currentUser;

  const wrapper = document.createElement("div");
  wrapper.className = `flex flex-col ${isMe ? "items-end" : "items-start"}`;

  if (!isMe) {
    const name = document.createElement("span");
    name.className = "text-[10px] font-bold text-gray-500 mb-1 ml-1";
    name.innerText = msg.username;
    wrapper.appendChild(name);
  }

  const bubble = document.createElement("div");
  bubble.className = `max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
    isMe
      ? "bg-indigo-600 text-white rounded-tr-none"
      : "bg-white text-gray-800 rounded-tl-none border"
  }`;
  bubble.innerText = msg.text;

  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);
  scrollToBottom();
}

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}
