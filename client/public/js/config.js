export const BASE_URL = "http://localhost:8000";
export const CHAT_SERVICE_URL = "http://localhost:5003";

export const API_ROUTES = {
    AUTH_LOGIN: `${BASE_URL}/api/auth/login`,
    AUTH_REGISTER: `${BASE_URL}/api/auth/register`,
    AUTH_REFRESH: `${BASE_URL}/api/auth/refresh`,
    AUTH_LOGOUT: `${BASE_URL}/api/auth/logout`,
    EVENTS: `${BASE_URL}/api/events`,
};

export const SOCKET_EVENTS = {
    CONNECT: "connect",
    JOIN_EVENT: "join-event",
    CHAT_MESSAGE: "chat-message",
    CHAT_HISTORY: "chat-history",
    UPDATE_USER_COUNT: "update-user-count",
    ADMIN_NEW_MESSAGE: "admin-new-message",
    ADMIN_DELETE_EVENT: "admin-delete-event",
};
