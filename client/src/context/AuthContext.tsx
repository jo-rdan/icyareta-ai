import React, { useState } from "react";
import { AuthContext, type User } from "./auth-context";
import api from "../lib/axios";

export type { AccessStatus, User } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("icy_token"),
  );
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("icy_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, code: string) => {
    const { data } = await api.post("/auth/verify-otp", {
      email,
      code,
    });

    // Fetch full access status
    const meRes = await api.get("/user/me", {
      headers: { Authorization: `Bearer ${data.token}` },
    });

    const fullUser: User = {
      id: data.user.id,
      email: data.user.email,
      phoneNumber: data.user.phoneNumber,
      hasUsedFreeTrial: data.user.hasUsedFreeTrial,
      accessStatus: meRes.data.accessStatus,
      accessExpiresAt: meRes.data.accessExpiresAt ?? undefined,
    };

    setUser(fullUser);
    setToken(data.token);
    localStorage.setItem("icy_token", data.token);
    localStorage.setItem("icy_user", JSON.stringify(fullUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("icy_token");
    localStorage.removeItem("icy_user");
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("icy_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
