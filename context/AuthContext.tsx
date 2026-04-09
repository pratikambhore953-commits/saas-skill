"use client";

import { createContext, useContext, useState } from "react";
import { getSession, signIn, signOut } from "next-auth/react";
import { isValidEmail, normalizeEmail, validatePassword } from "@/lib/authValidation";
import { loginWithPasswordApi, registerApi, sendOtpApi, verifyOtpApi } from "@/lib/authApi";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  sendOtp: (identifier: string) => Promise<{ expiresAt: number; lastSentAt: number }>;
  verifyOtp: (identifier: string, otp: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "skillswap_auth";
const TOKEN_KEY = "skillswap_token";
const ACCESS_TOKEN_KEY = "skillswap_access_token";
const OTP_TTL_MS = 10 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type SessionUserShape = {
  id?: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

function mapSessionUserToAuthUser(user: SessionUserShape): AuthUser {
  return {
    id: user.id ?? "",
    name: user.name ?? "SkillSwap User",
    email: user.email ?? "",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const setAuthSession = (authUser: AuthUser, accessToken: string, refreshToken: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    localStorage.setItem(TOKEN_KEY, refreshToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    document.cookie = `${TOKEN_KEY}=${refreshToken}; Max-Age=86400; Path=/; SameSite=Lax`;
    setUser(authUser);
  };

  const login = async (emailOrPhone: string, password: string) => {
    if (typeof window === "undefined") return;
    const email = normalizeEmail(emailOrPhone);

    if (!isValidEmail(email)) {
      throw new Error("Enter a valid email.");
    }

    if (!validatePassword(password)) {
      throw new Error("Password must be at least 8 characters.");
    }

    const response = await loginWithPasswordApi(email, password);
    setAuthSession(
      {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
      },
      response.data.accessToken,
      response.data.refreshToken,
    );
  };

  const sendOtp = async (identifier: string) => {
    const email = normalizeEmail(identifier);
    if (!isValidEmail(email)) {
      throw new Error("Enter a valid email.");
    }
    await sendOtpApi(email);
    const now = Date.now();
    return { expiresAt: now + OTP_TTL_MS, lastSentAt: now };
  };

  const verifyOtp = async (identifier: string, otp: string) => {
    const email = normalizeEmail(identifier);
    if (!isValidEmail(email)) {
      throw new Error("Enter a valid email.");
    }
    const response = await verifyOtpApi(email, otp);
    setAuthSession(
      {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
      },
      response.data.accessToken,
      response.data.refreshToken,
    );
  };

  const loginWithGoogle = async () => {
    const result = await signIn("google", { redirect: false });
    if (!result || result.error) {
      throw new Error(result?.error ?? "Google sign in failed.");
    }

    const session = await getSession();
    if (!session?.accessToken || !session?.refreshToken || !session.user) {
      throw new Error("Google session did not return backend tokens.");
    }

    setAuthSession(
      mapSessionUserToAuthUser(session.user as SessionUserShape),
      session.accessToken,
      session.refreshToken,
    );
  };

  const register = async (name: string, email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      throw new Error("Enter a valid email.");
    }
    if (!validatePassword(password)) {
      throw new Error("Password must be at least 8 characters.");
    }
    await registerApi(name.trim(), normalizedEmail, password);
    await sendOtpApi(normalizedEmail);
  };

  const logout = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
    setUser(null);
    void signOut({ redirect: false });
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading: false,
    login,
    sendOtp,
    verifyOtp,
    loginWithGoogle,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
