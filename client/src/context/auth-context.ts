import { createContext } from "react";

export type AccessStatus = "none" | "trial_used" | "active" | "expired";

export interface User {
  id: string;
  phoneNumber: string;
  hasUsedFreeTrial: boolean;
  accessStatus: AccessStatus;
  accessExpiresAt?: string;
  email?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, code: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  googleLogin: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
