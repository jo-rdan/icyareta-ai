import React, { useState, useEffect } from "react";
import { AuthContext, type User } from "./auth-context";

export type { AccessStatus, User } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("icy_token");
    const savedUser = localStorage.getItem("icy_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = async (phoneNumber: string, _otp: string) => {
    // MOCK — replace with POST /api/auth/verify-otp
    await new Promise((r) => setTimeout(r, 1000));
    const mockUser: User = {
      id: "mock-user-1",
      phoneNumber,
      hasUsedFreeTrial: false,
      accessStatus: "none",
    };
    const mockToken = "mock-jwt-token";
    setUser(mockUser);
    setToken(mockToken);
    localStorage.setItem("icy_token", mockToken);
    localStorage.setItem("icy_user", JSON.stringify(mockUser));
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
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
