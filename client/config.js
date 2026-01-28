export const BASE_URL = "http://localhost:8000";
export const CHAT_SERVICE_URL = "http://localhost:5003"; // Port Socket.IO

export const API_ROUTES = {
    AUTH_LOGIN: `${BASE_URL}/api/auth/login`,
    AUTH_REGISTER: `${BASE_URL}/api/auth/register`,
    AUTH_REFRESH: `${BASE_URL}/api/auth/refresh`,
    EVENTS: `${BASE_URL}/api/events`,
};
