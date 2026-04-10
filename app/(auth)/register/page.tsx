"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import OTPInput from "@/components/OTPInput";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail, validatePassword } from "@/lib/authValidation";

export default function RegisterPage() {
  const router = useRouter();
  const { register, verifyOtp, sendOtp, loginWithGoogle } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      setOtpStep(true);
      setMessage("Check your email for OTP.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (otp: string) => {
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await sendOtp(email);
      setMessage("OTP resent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center overflow-hidden bg-[#0F172A] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full rounded-2xl border border-slate-700 bg-[#1E293B] p-6 shadow-xl shadow-black/20"
      >
        <h1 className="text-2xl font-semibold text-white">{otpStep ? "Verify your email" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-slate-300">
          {otpStep ? "Use the 6-digit OTP sent to your inbox." : "Start exchanging skills in minutes."}
        </p>

        {!otpStep ? (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Full Name" value={name} setValue={setName} placeholder="Your full name" />
            <Field label="Email" value={email} setValue={setEmail} placeholder="you@example.com" type="email" />
            <Field label="Password" value={password} setValue={setPassword} placeholder="Enter a password" type="password" />
            <Field
              label="Confirm Password"
              value={confirmPassword}
              setValue={setConfirmPassword}
              placeholder="Confirm your password"
              type="password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-300">Check your email for OTP</p>
            <OTPInput onComplete={onVerify} disabled={loading} />
            <button
              type="button"
              onClick={onResendOtp}
              className="text-sm font-semibold text-amber-400 transition hover:text-amber-300"
            >
              Resend OTP
            </button>
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
          onClick={onGoogleSignup}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {(error || message) && (
          <p className={`mt-4 rounded-lg border px-3 py-2 text-sm ${error ? "border-red-400/30 bg-red-500/10 text-red-300" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"}`}>
            {error || message}
          </p>
        )}

        <p className="mt-4 text-sm text-slate-300">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-amber-400 hover:text-amber-300 hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  value,
  setValue,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  type?: "text" | "email" | "password";
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-200">{label}</label>
      <input
        type={type}
        className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent transition focus:ring-amber-500/35"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        required
      />
    </div>
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
