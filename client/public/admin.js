const socket = io();

const user = JSON.parse(localStorage.getItem("user"));
if (!user || user.role !== "admin") location.href = "/login.html";

socket.emit("join-event", { role: "admin" });

let eventsData = {};

const grid = document.getElementById("event-grid");
const modal = document.getElementById("chat-modal");
const modalContent = document.getElementById("modal-chat-content");
const modalTitle = document.getElementById("modal-title");

socket.on("admin-all-messages", (messages) => {
  eventsData = {};
  messages.forEach(add);
  render();
});

socket.on("admin-new-message", (msg) => {
  add(msg);
  render();
});

socket.on("admin-event-deleted", (eventId) => {
  delete eventsData[eventId];
  render();
  modal.classList.remove("modal-active");
});

function add(msg) {
  if (!eventsData[msg.eventId]) eventsData[msg.eventId] = [];
  eventsData[msg.eventId].push(msg);
}

function render() {
  grid.innerHTML = "";
  Object.keys(eventsData).forEach((id) => {
    const div = document.createElement("div");
    div.className = "p-4 bg-white rounded shadow cursor-pointer";
    div.innerHTML = `
      <b>${id}</b>
      <button class="text-red-500 float-right"
        onclick="del('${id}')">Delete</button>
    `;
    div.onclick = () => open(id);
    grid.appendChild(div);
  });
}

function open(id) {
  modalTitle.innerText = id;
  modalContent.innerHTML = "";
  eventsData[id].forEach((m) => {
    modalContent.innerHTML += `<div><b>${m.username}</b>: ${m.text}</div>`;
  });
  modal.classList.add("modal-active");
}

function del(id) {
  if (confirm("Xóa toàn bộ event?"))
    socket.emit("admin-delete-event", id);
}
