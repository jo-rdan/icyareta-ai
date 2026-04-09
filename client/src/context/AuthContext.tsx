import React, { useState } from "react";
import { AuthContext, type User } from "./auth-context";
import api from "../lib/axios";
import { useGoogleLogin } from "@react-oauth/google";

export type { AccessStatus, User } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("icy_token"),
  );
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("icy_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [nextStep, setNextStep] = useState<string | null>(null);

  const login = async (email: string, code: string, childName?: string) => {
    // Verify OTP — send childName so backend stores it on first signup
    const { data } = await api.post("/auth/verify-otp", {
      email,
      code,
      ...(childName ? { childName } : {}),
    });

    // Fetch full access status
    const meRes = await api.get("/user/me", {
      headers: { Authorization: `Bearer ${data.token}` },
    });

    const fullUser: User = {
      id: data.user.id,
      email: data.user.email,
      phoneNumber: data.user.phoneNumber,
      childName: data.user.childName ?? meRes.data.childName,
      hasUsedFreeTrial: data.user.hasUsedFreeTrial,
      accessStatus: meRes.data.accessStatus,
      accessExpiresAt: meRes.data.accessExpiresAt ?? undefined,
      accessType: meRes.data.accessType ?? undefined,
    };

    setUser(fullUser);
    setToken(data.token);
    setNextStep("childName");
    localStorage.setItem("icy_token", data.token);
    localStorage.setItem("icy_user", JSON.stringify(fullUser));
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const { data, status } = await api.post("/auth/google-signin", {
        accessToken: tokenResponse.access_token,
      });
      if (status === 200) {
        const meRes = await api.get("/user/me", {
          headers: { Authorization: `Bearer ${data.token}` },
        });

        const fullUser: User = {
          id: data.user.id,
          email: data.user.email,
          phoneNumber: data.user.phoneNumber,
          childName: data.user.childName ?? meRes.data.childName,
          hasUsedFreeTrial: data.user.hasUsedFreeTrial,
          accessStatus: meRes.data.accessStatus,
          accessExpiresAt: meRes.data.accessExpiresAt ?? undefined,
          accessType: meRes.data.accessType ?? undefined,
        };

        setUser(fullUser);
        setToken(data.token);
        setNextStep("childName");
        localStorage.setItem("icy_token", data.token);
        localStorage.setItem("icy_user", JSON.stringify(fullUser));
      }
    },
    onError: () => console.error("error on Google auth"),
  });

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
      value={{ user, token, login, googleLogin, logout, updateUser, nextStep }}
    >
      {children}
    </AuthContext.Provider>
  );
}
