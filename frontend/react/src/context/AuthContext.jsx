
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("jobtrack_token");

    if (!token) {
        setUser(null);
        setLoading(false);
        return;
    }

    try {
        const response = await api.get("/auth/me");
        setUser(response.data.data);
    } catch {
        localStorage.removeItem("jobtrack_token");
        setUser(null);
    } finally {
        setLoading(false);
    }
    }, []);

    useEffect(() => {
    fetchMe();
    }, [fetchMe]);

    const login = async (email, password) => {
    const response = await api.post("/auth/login", {
        email,
        password,
    });

    localStorage.setItem(
        "jobtrack_token",
        response.data.token
    );

    setUser(response.data.data);

    return response.data;
    };

    const register = async (formData) => {
    const response = await api.post(
        "/auth/register",
        formData
    );

    return response.data;
    };

    const logout = () => {
    localStorage.removeItem("jobtrack_token");
    setUser(null);
    };

    return (
    <AuthContext.Provider
        value={{
        user,
        loading,
        login,
        register,
        logout,
        fetchMe,
        }}
    >
        {children}
    </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
