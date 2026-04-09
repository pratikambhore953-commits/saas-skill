"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import SparkleBackground from "@/components/SparkleBackground";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center overflow-hidden bg-[#0F172A] px-4 py-10">
      <SparkleBackground />
      <motion.div
        className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl"
        animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl"
        animate={{ scale: [1.05, 1, 1.05], opacity: [0.15, 0.1, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={error ? { opacity: 1, y: 0, x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0, x: 0 }}
        transition={error ? { duration: 0.4 } : { duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full rounded-2xl border border-slate-700 bg-[#1E293B] p-6 shadow-xl shadow-black/20"
      >
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.35 }}>
          <h1 className="text-2xl font-semibold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-300">Start exchanging skills in minutes.</p>
        </motion.div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}>
            <label className="mb-1 block text-sm font-medium text-slate-200">Full Name</label>
            <input
              className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent transition focus:ring-amber-500/35"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35, ease: "easeOut" }}>
            <label className="mb-1 block text-sm font-medium text-slate-200">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent transition focus:ring-amber-500/35"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35, ease: "easeOut" }}>
            <label className="mb-1 block text-sm font-medium text-slate-200">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent transition focus:ring-amber-500/35"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a password"
              required
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.35, ease: "easeOut" }}>
            <label className="mb-1 block text-sm font-medium text-slate-200">Confirm Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent transition focus:ring-amber-500/35"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </motion.div>

          {error && (
            <motion.p
              className="text-sm text-red-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.25 }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.35 }}
            className="w-full rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  className="inline-block h-4 w-4 rounded-full border-2 border-black/30 border-t-black"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                />
                Creating account...
              </span>
            ) : (
              "Register"
            )}
          </motion.button>
        </form>

        <motion.p
          className="mt-4 text-sm text-slate-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
        >
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-amber-400 hover:text-amber-300 hover:underline">
            Login
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
