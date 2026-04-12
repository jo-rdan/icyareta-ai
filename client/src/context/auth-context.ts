import { createContext } from "react";

export type AccessStatus = "none" | "trial_used" | "active";

export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  childName?: string; // the P6 child this parent is preparing
  hasUsedFreeTrial: boolean;
  accessStatus: AccessStatus;
  accessExpiresAt?: string;
  accessType?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, code: string, childName?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  googleLogin: () => void;
  hasCancelled?: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
