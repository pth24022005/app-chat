const socket = io();

const joinScreen = document.getElementById("join-screen");
const chatScreen = document.getElementById("chat-screen");
const joinBtn = document.getElementById("joinBtn");
const sendBtn = document.getElementById("sendBtn");
const chatBox = document.getElementById("chat");
const msgInput = document.getElementById("message");
const statusText = document.getElementById("status-text");
const onlineIndicator = document.getElementById("online-indicator");

let currentUser = "";

joinBtn.onclick = () => {
  const username = document.getElementById("username").value.trim();
  const eventId = document.getElementById("eventId").value.trim();
  
  if (!username || !eventId) {
    alert("Please fill in all fields");
    return;
  }

  currentUser = username;

  // Emit event join
  socket.emit("join-event", { username, eventId });

  // Switch UI
  joinScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  statusText.innerText = `In Event: ${eventId}`;
  onlineIndicator.classList.replace("bg-gray-300", "bg-green-500");
};

sendBtn.onclick = sendMessage;
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  socket.emit("chat-message", text);
  msgInput.value = "";
}

socket.on("chat-history", (messages) => {
  chatBox.innerHTML = "";
  messages.forEach(renderMessage);
});

socket.on("chat-message", renderMessage);

socket.on("system-message", (text) => {
  const div = document.createElement("div");
  div.className = "text-center text-[10px] uppercase tracking-widest text-gray-400 my-2";
  div.innerText = text;
  chatBox.appendChild(div);
  scrollToBottom();
});

function renderMessage(msg) {
  const isMe = msg.username === currentUser;
  
  const wrapper = document.createElement("div");
  wrapper.className = `flex flex-col ${isMe ? "items-end" : "items-start"}`;

  const bubble = document.createElement("div");
  bubble.className = `max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
    isMe 
    ? "bg-indigo-600 text-white rounded-tr-none" 
    : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
  }`;

  if (!isMe) {
    const nameTag = document.createElement("span");
    nameTag.className = "text-[10px] font-bold text-gray-500 mb-1 ml-1";
    nameTag.innerText = msg.username;
    wrapper.appendChild(nameTag);
  }

  bubble.innerText = msg.text;
  wrapper.appendChild(bubble);

  // Add simple timestamp
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeTag = document.createElement("span");
  timeTag.className = "text-[9px] text-gray-400 mt-1 mx-1";
  timeTag.innerText = time;
  wrapper.appendChild(timeTag);

  chatBox.appendChild(wrapper);
  scrollToBottom();
}

function scrollToBottom() {
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}