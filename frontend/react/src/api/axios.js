
import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL || "http://localhost:5000/api",

    headers: {
        "Content-Type": "application/json",
    },

    timeout: 15000,
});

// Attach the JWT token to requests when one exists.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("jobtrack_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Centralized response error handling.
api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.code === "ECONNABORTED") {
            error.userMessage =
                "The request took too long. Please try again.";
        } else if (!error.response) {
            error.userMessage =
                "Unable to connect to the server. Check your connection and try again.";
        } else {
            const status = error.response.status;
            const serverMessage = error.response.data?.message;

            if (status === 401) {
                error.userMessage =
                    serverMessage || "Your session is invalid or has expired. Please log in again.";
            } else if (status === 403) {
                error.userMessage =
                    serverMessage || "You do not have permission to perform this action.";
            } else if (status >= 500) {
                error.userMessage =
                    "A server error occurred. Please try again later.";
            } else {
                error.userMessage =
                    serverMessage || "The request could not be completed.";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
