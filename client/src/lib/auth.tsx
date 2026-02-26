import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "./queryClient";

interface User {
  id?: number;
  tgId?: string;
  username?: string;
  tier?: string;
  requestsLeft?: number;
  streakDays?: number;
  refCode?: string;
  firstName?: string;
  photoUrl?: string;
  email?: string;
  provider?: "telegram" | "google";
  profileImageUrl?: string;
  lastLogin?: string;
  notifsOn?: boolean;
  digestsOn?: boolean;
  lang?: string;
  totpEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresTwoFactor: boolean;
  login: (telegramData: any) => Promise<void>;
  verifyTwoFactor: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser({
            id: data.id || data.userId,
            tgId: data.tgId,
            username: data.username,
            photoUrl: data.photoUrl || "",
            tier: data.tier,
            requestsLeft: data.requestsLeft,
            streakDays: data.streakDays,
            refCode: data.refCode,
            provider: data.provider || "telegram",
            lastLogin: data.lastLogin,
            notifsOn: data.notifsOn,
            digestsOn: data.digestsOn,
            lang: data.lang,
            totpEnabled: data.totpEnabled,
          });
          setRequiresTwoFactor(false);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (telegramData: any) => {
    const res = await apiRequest("POST", "/api/auth/telegram", telegramData);
    if (res.ok) {
      const userData = await res.json();
      if (userData.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        return;
      }
      setUser(userData);
      setRequiresTwoFactor(false);
    } else {
      throw new Error("Login failed");
    }
  };

  const verifyTwoFactor = async (token: string) => {
    const res = await apiRequest("POST", "/api/2fa/login-verify", { token });
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      setRequiresTwoFactor(false);
    } else {
      throw new Error("Invalid 2FA code");
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } finally {
      setUser(null);
      setRequiresTwoFactor(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        requiresTwoFactor,
        login,
        verifyTwoFactor,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
