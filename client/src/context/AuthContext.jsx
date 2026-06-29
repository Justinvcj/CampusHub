import { useEffect, useState } from "react";
import api, { setAccessToken } from "../services/api";
import { AuthContext } from "./auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const restore = async () => {
      try {
        if (!sessionStorage.getItem("accessToken")) {
          const { data } = await api.post("/auth/refresh");
          setAccessToken(data.data.accessToken);
        }
        const { data } = await api.get("/auth/me");
        setUser(data.data);
      } catch { setAccessToken(null); }
      finally { setLoading(false); }
    };
    restore();
  }, []);
  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    setAccessToken(data.data.accessToken); setUser(data.data.user);
  };
  const register = async (details) => {
    const { data } = await api.post("/auth/register", details);
    setAccessToken(data.data.accessToken); setUser(data.data.user);
  };
  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setAccessToken(null); setUser(null);
  };
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
