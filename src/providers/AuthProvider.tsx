"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User { username: string; role: string; }
interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({
  user: null, token: null,
  login: async () => {}, logout: () => {}, loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("acorn_token");
    const u = localStorage.getItem("acorn_user");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const data = await res.json();
    setToken(data.token);
    setUser({ username: data.username, role: data.role });
    localStorage.setItem("acorn_token", data.token);
    localStorage.setItem("acorn_user", JSON.stringify({ username: data.username, role: data.role }));
    document.cookie = `acorn_token=${data.token}; path=/`;
  }, []);

  const logout = useCallback(() => {
    setToken(null); setUser(null);
    localStorage.removeItem("acorn_token");
    localStorage.removeItem("acorn_user");
    document.cookie = "acorn_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function useApiClient() {
  const { token } = useAuth();
  return useCallback(async (path: string, options?: RequestInit) => {
    const res = await fetch(`http://localhost:8000${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return res.json();
  }, [token]);
}
