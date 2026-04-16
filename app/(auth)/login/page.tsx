"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import toast from "react-hot-toast";
import OTPInput from "@/components/OTPInput";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail, validatePassword } from "@/lib/authValidation";

type LoginMode = "password" | "otp";

function getSafeNextPath(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const { login, sendOtp, verifyOtp, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("aarav@example.com");
  const [password, setPassword] = useState("password123");
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"password" | "otp-send" | "otp-verify" | "google" | null>(null);
  const hasDisplayedQueryParamMessage = useRef(false);

  useEffect(() => {
    if (!otpExpiry) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [otpExpiry]);

  const otpRemainingSeconds = useMemo(() => {
    if (!otpExpiry) return 0;
    return Math.max(0, Math.ceil((otpExpiry - now) / 1000));
  }, [otpExpiry, now]);

  const canResendOtp = otpRemainingSeconds === 0;

  useEffect(() => {
    if (hasDisplayedQueryParamMessage.current) return;
    const message = searchParams.get("message");
    if (message) {
      hasDisplayedQueryParamMessage.current = true;
      toast.error(message);
    }
  }, [searchParams]);

  const redirectToNext = () => {
    router.push(getSafeNextPath(searchParams.get("next")));
  };

  const onPasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setActiveAction("password");
    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const onSendOtp = async () => {
    setError("");
    setMessage("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email.");
      return;
    }
    setLoading(true);
    setActiveAction("otp-send");
    try {
      const payload = await sendOtp(email);
      setOtpExpiry(payload.expiresAt);
      setMessage("OTP sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send OTP");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const onVerifyOtp = async (otp: string) => {
    setError("");
    setMessage("");
    setLoading(true);
    setActiveAction("otp-verify");
    try {
      await verifyOtp(email, otp);
      redirectToNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify OTP");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const onGoogleLogin = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    setActiveAction("google");
    try {
      await loginWithGoogle();
      redirectToNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[#020617]">
      <video
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-45"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/auth-bg-fallback.png"
        aria-hidden="true"
      >
        <source src="/auth-bg.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.24),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_40%),linear-gradient(to_bottom,rgba(2,6,23,0.82),rgba(2,6,23,0.95))]" />
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-20 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-4 py-10"
      >
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden lg:block">
            <p className="inline-flex w-fit rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              Skill Swap
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight tracking-tight text-white">
              Log in to connect, learn, and teach.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-slate-300">
              Access your sessions, discover new matches, and continue growing your career with curated skill exchange.
            </p>
          </section>

          <div className="w-full rounded-2xl border border-white/10 bg-[#0b1224]/85 p-6 shadow-2xl shadow-black/35 backdrop-blur xl:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                Secure Login
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">Use password, OTP, or Google sign in.</p>

            <div className="mt-5 grid grid-cols-2 rounded-xl border border-white/10 bg-white/5 p-1">
              <ModeTab label="Password" active={mode === "password"} onClick={() => setMode("password")} />
              <ModeTab label="OTP Login" active={mode === "otp"} onClick={() => setMode("otp")} />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-200">Email</label>
              <input
                className="w-full rounded-xl border border-white/15 bg-[#111a33] px-3.5 py-2.5 text-white outline-none ring-2 ring-transparent transition focus:border-amber-400/50 focus:ring-amber-400/20"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                required
              />
            </div>

            {mode === "password" ? (
              <form onSubmit={onPasswordSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-200">Password</label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-white/15 bg-[#111a33] px-3.5 py-2.5 text-white outline-none ring-2 ring-transparent transition focus:border-amber-400/50 focus:ring-amber-400/20"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading && activeAction === "password" ? "Logging in..." : "Log in"}
                </button>
              </form>
            ) : (
              <div className="mt-4 space-y-4">
                <button
                  type="button"
                  disabled={loading || (otpExpiry !== null && !canResendOtp)}
                  onClick={onSendOtp}
                  className="w-full rounded-xl border border-amber-500/60 bg-amber-500/15 px-4 py-2.5 font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && activeAction === "otp-send"
                    ? "Sending OTP..."
                    : otpExpiry && !canResendOtp
                      ? `Resend in ${otpRemainingSeconds}s`
                      : "Send OTP"}
                </button>
                <p className="text-xs text-slate-300">Enter the 6-digit OTP sent to your email.</p>
                <OTPInput disabled={loading} onComplete={onVerifyOtp} />
              </div>
            )}

            <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-white/15" />
              <span>OR</span>
              <span className="h-px flex-1 bg-white/15" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={onGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <GoogleIcon />
              {loading && activeAction === "google" ? "Signing in with Google..." : "Continue with Google"}
            </button>

            {(error || message) && (
              <motion.p
                className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                  error
                    ? "border-red-400/30 bg-red-500/10 text-red-300"
                    : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                }`}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {error || message}
              </motion.p>
            )}

            <p className="mt-5 text-sm text-slate-300">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-amber-300 transition hover:text-amber-200 hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ModeTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-amber-500 text-black" : "text-slate-300 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93l2.86-2.84.8-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#020617]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.24),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_40%),linear-gradient(to_bottom,rgba(2,6,23,0.82),rgba(2,6,23,0.95))]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-4 py-10">
        <div className="ml-auto w-full max-w-xl animate-pulse rounded-2xl border border-white/10 bg-[#0b1224]/85 p-6">
          <div className="h-8 w-44 rounded bg-slate-700" />
          <div className="mt-3 h-4 w-60 rounded bg-slate-700" />
          <div className="mt-6 h-10 w-full rounded-xl bg-slate-700" />
          <div className="mt-4 h-10 w-full rounded-xl bg-slate-700" />
          <div className="mt-4 h-10 w-full rounded-xl bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
