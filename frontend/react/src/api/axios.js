import axios from "axios";

const api = axios.create({
    baseURL : import.meta.VITE_API_UR || "http://localhost:5000/api",
    headers : {
        "Content-Type" : "application/json",
    },
});

// Attach the token to requests when one exists.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("jobtrack_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;