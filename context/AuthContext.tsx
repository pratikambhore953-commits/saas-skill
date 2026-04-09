"use client";

import { createContext, useContext, useState } from "react";
import {
  isValidEmail,
  normalizeEmail,
  normalizeIdentifier,
  normalizePhone,
  OTP_REGEX,
  validatePassword,
} from "@/lib/authValidation";

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
const USERS_KEY = "skillswap_mock_users";
const OTP_STATE_KEY = "skillswap_otp_state";
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_INTERVAL_MS = 30 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_CODE = "123456";

const seedUsers: AuthUser[] = [
  { id: "u1", name: "Aarav", email: "aarav@example.com", phone: "+919876543210" },
  { id: "u2", name: "Maya", email: "maya@example.com", phone: "+919123456789" },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AuthUser[]>(() => {
    if (typeof window === "undefined") return seedUsers;
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
      return seedUsers;
    }
    try {
      const parsed = JSON.parse(raw) as AuthUser[];
      return parsed.length > 0 ? parsed : seedUsers;
    } catch {
      localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
      return seedUsers;
    }
  });

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

  const setAuthSession = (authUser: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    localStorage.setItem(TOKEN_KEY, "mock-token");
    localStorage.setItem(ACCESS_TOKEN_KEY, "mock-token");
    document.cookie = `${TOKEN_KEY}=mock-token; Max-Age=86400; Path=/; SameSite=Lax`;
    setUser(authUser);
  };

  const login = async (emailOrPhone: string, password: string) => {
    if (typeof window === "undefined") return;
    const normalizedIdentifier = normalizeIdentifier(emailOrPhone);

    if (!normalizedIdentifier) {
      throw new Error("Enter a valid email or phone number.");
    }

    if (!validatePassword(password)) {
      throw new Error("Password must be at least 8 characters.");
    }

    const found = users.find((entry) => {
      const normalizedEmail = normalizeEmail(entry.email);
      const normalizedPhone = entry.phone ? normalizePhone(entry.phone) : "";
      return normalizedIdentifier === normalizedEmail || normalizedIdentifier === normalizedPhone;
    });

    if (!found) {
      throw new Error("No account found for this identifier.");
    }

    setAuthSession(found);
  };

  const sendOtp = async (identifier: string) => {
    if (typeof window === "undefined") {
      throw new Error("OTP is available in browser only.");
    }

    const normalizedIdentifier = normalizeIdentifier(identifier);
    if (!normalizedIdentifier) {
      throw new Error("Enter a valid email or phone number.");
    }

    const found = users.find((entry) => {
      const normalizedEmail = normalizeEmail(entry.email);
      const normalizedPhone = entry.phone ? normalizePhone(entry.phone) : "";
      return normalizedIdentifier === normalizedEmail || normalizedIdentifier === normalizedPhone;
    });

    if (!found) {
      throw new Error("No account found for this identifier.");
    }

    const now = Date.now();
    const rawState = localStorage.getItem(OTP_STATE_KEY);
    const parsedState = rawState
      ? (JSON.parse(rawState) as {
          identifier: string;
          expiresAt: number;
          lastSentAt: number;
          attempts: number;
          userId: string;
        })
      : null;

    if (parsedState && parsedState.identifier === normalizedIdentifier && now - parsedState.lastSentAt < OTP_RESEND_INTERVAL_MS) {
      throw new Error(`Please wait ${Math.ceil((OTP_RESEND_INTERVAL_MS - (now - parsedState.lastSentAt)) / 1000)}s before resending.`);
    }

    const nextState = {
      identifier: normalizedIdentifier,
      expiresAt: now + OTP_TTL_MS,
      lastSentAt: now,
      attempts: 0,
      userId: found.id,
      code: OTP_CODE,
    };

    localStorage.setItem(OTP_STATE_KEY, JSON.stringify(nextState));
    return { expiresAt: nextState.expiresAt, lastSentAt: nextState.lastSentAt };
  };

  const verifyOtp = async (identifier: string, otp: string) => {
    if (typeof window === "undefined") {
      throw new Error("OTP is available in browser only.");
    }

    const normalizedIdentifier = normalizeIdentifier(identifier);
    if (!normalizedIdentifier) {
      throw new Error("Enter a valid email or phone number.");
    }

    if (!OTP_REGEX.test(otp.trim())) {
      throw new Error("OTP must be a 6-digit code.");
    }

    const rawState = localStorage.getItem(OTP_STATE_KEY);
    if (!rawState) {
      throw new Error("OTP expired. Please request a new code.");
    }

    const state = JSON.parse(rawState) as {
      identifier: string;
      expiresAt: number;
      attempts: number;
      userId: string;
      code: string;
    };

    if (state.identifier !== normalizedIdentifier) {
      throw new Error("OTP does not match this identifier.");
    }

    if (Date.now() > state.expiresAt) {
      localStorage.removeItem(OTP_STATE_KEY);
      throw new Error("OTP expired. Please request a new code.");
    }

    if (state.attempts >= OTP_MAX_ATTEMPTS) {
      localStorage.removeItem(OTP_STATE_KEY);
      throw new Error("Too many invalid attempts. Request a new OTP.");
    }

    if (state.code !== otp.trim()) {
      const nextAttempts = state.attempts + 1;
      localStorage.setItem(OTP_STATE_KEY, JSON.stringify({ ...state, attempts: nextAttempts }));
      throw new Error(`Invalid OTP. ${OTP_MAX_ATTEMPTS - nextAttempts} attempts left.`);
    }

    const found = users.find((entry) => entry.id === state.userId);
    if (!found) {
      throw new Error("Account not found.");
    }

    localStorage.removeItem(OTP_STATE_KEY);
    setAuthSession(found);
  };

  const loginWithGoogle = async () => {
    if (typeof window === "undefined") return;

    const googleUser = users.find((entry) => normalizeEmail(entry.email) === "aarav@example.com") ?? users[0];
    if (!googleUser) {
      throw new Error("No users available to sign in.");
    }

    setAuthSession(googleUser);
  };

  const register = async (name: string, email: string, password: string) => {
    if (typeof window === "undefined") return;
    const normalizedName = name.trim();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedName || normalizedName.length < 2) {
      throw new Error("Name must be at least 2 characters.");
    }

    if (!isValidEmail(normalizedEmail)) {
      throw new Error("Enter a valid email.");
    }

    if (!validatePassword(password)) {
      throw new Error("Password must be at least 8 characters.");
    }
    const existing = users.find((entry) => normalizeEmail(entry.email) === normalizedEmail);
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const newUser: AuthUser = {
      id: `u${Date.now()}`,
      name: normalizedName,
      email: normalizedEmail,
    };

    const updatedUsers = [newUser, ...users];
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    setAuthSession(newUser);
  };

  const logout = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(OTP_STATE_KEY);
    document.cookie = `${TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
    setUser(null);
  };

  const value = {
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
