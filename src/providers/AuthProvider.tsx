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
  const [user, setUser] = useState<User | null>({ username: "admin", role: "admin" });
  const [token, setToken] = useState<string | null>("demo-token");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auth bypassed for demo
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setToken("demo-token");
    setUser({ username, role: "admin" });
    window.location.href = "/dashboard";
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
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${API_BASE}${path}`, {
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
