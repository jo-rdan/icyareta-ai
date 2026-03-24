import { createContext } from "react";

export type AccessStatus = "none" | "trial_used" | "active" | "expired";

export interface User {
  id: string;
  phoneNumber: string;
  hasUsedFreeTrial: boolean;
  accessStatus: AccessStatus;
  accessExpiresAt?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phoneNumber: string, otp: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
