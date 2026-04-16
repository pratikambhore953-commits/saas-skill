"use client";

import { createContext, useContext, useState } from "react";
import { getSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { isValidEmail, normalizeEmail, validatePassword } from "@/lib/authValidation";
import {
  AuthApiUser,
  loginWithPasswordApi,
  registerApi,
  sendOtpApi,
  uploadAvatarApi,
  verifyOtpApi,
} from "@/lib/authApi";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string | null;
  bio?: string | null;
  about_me?: string | null;
  location?: string | null;
  is_verified?: boolean;
  email_verified?: boolean;
  auth_provider?: "LOCAL" | "GOOGLE";
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean }>;
  sendOtp: (identifier: string) => Promise<{ expiresAt: number; lastSentAt: number }>;
  verifyOtp: (identifier: string, otp: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => void;
  updateCurrentUser: (user: AuthUser) => void;
  uploadAvatar: (file: File) => Promise<AuthUser>;
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
  bio?: string | null;
  location?: string | null;
  is_verified?: boolean;
  email_verified?: boolean;
  auth_provider?: "LOCAL" | "GOOGLE";
};

function mapApiUserToAuthUser(user: AuthApiUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    bio: user.bio,
    location: user.location,
    is_verified: user.is_verified,
    email_verified: user.email_verified,
    auth_provider: user.auth_provider,
  };
}

function mapSessionUserToAuthUser(user: SessionUserShape): AuthUser {
  return {
    id: user.id ?? "",
    name: user.name ?? "SkillSwap User",
    email: user.email ?? "",
    avatar_url: user.avatar_url ?? null,
    bio: user.bio ?? null,
    location: user.location ?? null,
    is_verified: user.is_verified,
    email_verified: user.email_verified,
    auth_provider: user.auth_provider,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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

  const persistUser = (authUser: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const setAuthSession = (authUser: AuthUser, accessToken: string, refreshToken: string) => {
    persistUser(authUser);
    localStorage.setItem(TOKEN_KEY, refreshToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    document.cookie = `${TOKEN_KEY}=${refreshToken}; Max-Age=86400; Path=/; SameSite=Lax`;
  };

  const login = async (emailOrPhone: string, password: string): Promise<{ success: boolean }> => {
    if (typeof window === "undefined") {
      return { success: false };
    }
    const email = normalizeEmail(emailOrPhone);

    if (!isValidEmail(email)) {
      throw new Error("Enter a valid email.");
    }

    if (!validatePassword(password)) {
      throw new Error("Password must be at least 8 characters.");
    }

    const response = await loginWithPasswordApi(email, password);
    setAuthSession(
      mapApiUserToAuthUser(response.data.user),
      response.data.accessToken,
      response.data.refreshToken,
    );
    toast.success(`Welcome back, ${response.data.user.name}!`);
    router.push("/dashboard");
    return { success: true };
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
      mapApiUserToAuthUser(response.data.user),
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
    toast.success(`Welcome back, ${(session.user as SessionUserShape).name ?? "there"}!`);
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
    toast.success("Account created! Welcome!");
  };

  const updateCurrentUser = (nextUser: AuthUser) => {
    persistUser(nextUser);
  };

  const updateUser = (userData: Partial<AuthUser>) => {
    setUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }
      const mergedUser: AuthUser = { ...prevUser, ...userData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedUser));
      return mergedUser;
    });
  };

  const uploadAvatar = async (file: File) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      throw new Error("You must be logged in to upload avatar.");
    }

    const response = await uploadAvatarApi(file, accessToken);
    const updated = mapApiUserToAuthUser(response.data.user);
    persistUser(updated);
    return updated;
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
    updateUser,
    updateCurrentUser,
    uploadAvatar,
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
