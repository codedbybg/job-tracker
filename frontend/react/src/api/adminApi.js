
import api from "./axios";

export const getAdminStats = async () => {
    const response = await api.get("/admin/stats");
    return response.data;
};

export const getAdminUsers = async (params = {}) => {
    const response = await api.get("/users", { params });
    return response.data;
};

export const updateAdminUser = async (userId, updates) => {
    const response = await api.put(`/users/${userId}`, updates);
    return response.data;
};

export const deleteAdminUser = async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
};
