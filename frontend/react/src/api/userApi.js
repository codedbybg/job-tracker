
import api from "./axios";

// Fetch users from the backend.
export const getUsers = async (params = {}) => {
  const response = await api.get("/users", { params });
  return response.data;
};

// Update an eligible user's role or account status.
export const updateUser = async (id, payload) => {
  const response = await api.put(`/users/${id}`, payload);
  return response.data;
};

// Delete an eligible user.
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
