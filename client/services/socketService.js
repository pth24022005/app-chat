import { CHAT_SERVICE_URL } from "../config.js";

let socket = null;

export function initSocket() {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    if (!socket) {
        socket = io(CHAT_SERVICE_URL, {
            auth: { token: token },
        });
    }
    return socket;
}

export function getSocket() {
    return socket || initSocket();
}
