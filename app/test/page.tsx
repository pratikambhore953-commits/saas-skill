"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = "connected" | "configured" | "missing" | "error" | "checking";

interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    database: "connected" | "error";
    resend: "configured" | "missing";
    google_oauth: "configured" | "missing";
    cloudinary: "configured" | "missing";
    agora: "configured" | "missing";
    jwt: "configured" | "missing";
    socket_io: "running" | "error";
  };
}

interface ServiceCard {
  key: keyof HealthResponse["services"];
  label: string;
  icon: React.ReactNode;
}

interface TestResult {
  ok: boolean;
  message: string;
  extra?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

const CHECKLIST_ITEMS = [
  "User can register with email + password",
  "User can login with email + password",
  "User can login with Google",
  "User can receive OTP email",
  "User can upload profile photo",
  "User can add skills",
  "User can browse other users",
  "User can book a session",
  "User can chat in real time",
  "Video call connects",
  "Email notifications arrive",
];

const CHECKLIST_STORAGE_KEY = "skillswap_test_checklist";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function DbIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth="2" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" strokeWidth="2" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" strokeWidth="2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth="2" />
      <path d="M2 7l10 7 10-7" strokeWidth="2" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeWidth="2"
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon points="23 7 16 12 23 17 23 7" strokeWidth="2" />
      <rect x="1" y="5" width="15" height="14" rx="2" strokeWidth="2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" />
    </svg>
  );
}

function SocketIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ServiceStatus | "running" }) {
  const isGood = status === "connected" || status === "configured" || status === "running";
  const isChecking = status === "checking";

  const color = isChecking
    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    : isGood
    ? "bg-green-500/20 text-green-300 border-green-500/30"
    : "bg-red-500/20 text-red-300 border-red-500/30";

  const dotColor = isChecking
    ? "bg-yellow-400"
    : isGood
    ? "bg-green-400"
    : "bg-red-400";

  const label = isChecking
    ? "Checking…"
    : status === "connected" || status === "running"
    ? "Connected"
    : status === "configured"
    ? "Configured"
    : "Error";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isChecking ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestPage() {
  const { data: session } = useSession();

  // Guard: only development
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Restricted</h1>
          <p className="text-slate-400">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  return <DevDashboard session={session} />;
}

interface SessionUser {
  name?: string | null;
  email?: string | null;
}

function DevDashboard({ session }: { session: { user?: SessionUser } | null }) {
  // ── Section 1: Auto checks ──────────────────────────────────────────────────
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const serviceCards: ServiceCard[] = [
    { key: "database", label: "Database (Supabase)", icon: <DbIcon /> },
    { key: "resend", label: "Email (Resend)", icon: <MailIcon /> },
    { key: "google_oauth", label: "Google OAuth", icon: <GoogleIcon /> },
    { key: "cloudinary", label: "Cloudinary", icon: <CloudIcon /> },
    { key: "agora", label: "Agora Video", icon: <VideoIcon /> },
    { key: "jwt", label: "JWT Auth", icon: <LockIcon /> },
    { key: "socket_io", label: "Socket.io", icon: <SocketIcon /> },
  ];

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`${API}/api/health`);
      const data = (await res.json()) as HealthResponse;
      setHealthData(data);
    } catch {
      setHealthData(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
  }, [fetchHealth]);

  function getServiceStatus(key: keyof HealthResponse["services"]): ServiceStatus | "running" {
    if (healthLoading) return "checking";
    if (!healthData) return "error";
    const val = healthData.services[key];
    if (val === "running") return "running";
    return val as ServiceStatus;
  }

  // ── Section 2: Manual tests ─────────────────────────────────────────────────
  const [emailInput, setEmailInput] = useState("");
  const [emailResult, setEmailResult] = useState<TestResult | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [dbResult, setDbResult] = useState<TestResult | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  const [cloudResult, setCloudResult] = useState<TestResult | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudThumb, setCloudThumb] = useState<string | null>(null);

  const [socketResult, setSocketResult] = useState<TestResult | null>(null);
  const [socketLoading, setSocketLoading] = useState(false);

  const [agoraResult, setAgoraResult] = useState<TestResult | null>(null);
  const [agoraLoading, setAgoraLoading] = useState(false);

  async function testEmail() {
    if (!emailInput) return;
    setEmailLoading(true);
    setEmailResult(null);
    try {
      const res = await fetch(`${API}/api/health/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailInput }),
      });
      const data = (await res.json()) as { sent: boolean; message_id?: string; error?: string };
      if (data.sent) {
        setEmailResult({ ok: true, message: "Email sent! Check your inbox.", extra: data.message_id });
      } else {
        setEmailResult({ ok: false, message: data.error ?? "Failed to send email" });
      }
    } catch (e) {
      setEmailResult({ ok: false, message: e instanceof Error ? e.message : "Network error" });
    } finally {
      setEmailLoading(false);
    }
  }

  async function testDatabase() {
    setDbLoading(true);
    setDbResult(null);
    try {
      const res = await fetch(`${API}/api/health/database`);
      const data = (await res.json()) as { connected: boolean; users_count?: number; error?: string };
      if (data.connected) {
        setDbResult({ ok: true, message: `Connected — ${data.users_count ?? 0} users in database` });
      } else {
        setDbResult({ ok: false, message: data.error ?? "Database connection failed" });
      }
    } catch (e) {
      setDbResult({ ok: false, message: e instanceof Error ? e.message : "Network error" });
    } finally {
      setDbLoading(false);
    }
  }

  async function testCloudinary() {
    setCloudLoading(true);
    setCloudResult(null);
    setCloudThumb(null);
    try {
      const res = await fetch(`${API}/api/health/test-cloudinary`, { method: "POST" });
      const data = (await res.json()) as { uploaded: boolean; url?: string; error?: string };
      if (data.uploaded) {
        setCloudResult({ ok: true, message: "Upload working", extra: data.url });
        setCloudThumb(data.url ?? null);
      } else {
        setCloudResult({ ok: false, message: data.error ?? "Upload failed" });
      }
    } catch (e) {
      setCloudResult({ ok: false, message: e instanceof Error ? e.message : "Network error" });
    } finally {
      setCloudLoading(false);
    }
  }

  async function testSocket() {
    setSocketLoading(true);
    setSocketResult(null);
    try {
      const res = await fetch(`${API}/api/health/test-socket`);
      const data = (await res.json()) as {
        running: boolean;
        connected_clients?: number;
        error?: string;
      };
      if (data.running) {
        setSocketResult({
          ok: true,
          message: `WebSocket server running — ${data.connected_clients ?? 0} clients online`,
        });
      } else {
        setSocketResult({ ok: false, message: data.error ?? "Socket server not running" });
      }
    } catch (e) {
      setSocketResult({ ok: false, message: e instanceof Error ? e.message : "Network error" });
    } finally {
      setSocketLoading(false);
    }
  }

  async function testAgora() {
    setAgoraLoading(true);
    setAgoraResult(null);
    try {
      const res = await fetch(`${API}/api/health/test-agora`);
      const data = (await res.json()) as {
        generated: boolean;
        token?: string;
        app_id?: string;
        expires_in?: string;
        error?: string;
      };
      if (data.generated) {
        const tokenPreview = data.token ? data.token.substring(0, 20) + "…" : "";
        setAgoraResult({
          ok: true,
          message: `Token generated (${data.expires_in ?? "1 hour"})`,
          extra: tokenPreview,
        });
      } else {
        setAgoraResult({ ok: false, message: data.error ?? "Token generation failed" });
      }
    } catch (e) {
      setAgoraResult({ ok: false, message: e instanceof Error ? e.message : "Network error" });
    } finally {
      setAgoraLoading(false);
    }
  }

  // ── Section 4: Checklist ───────────────────────────────────────────────────
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    if (typeof window === "undefined") return CHECKLIST_ITEMS.map(() => false);
    try {
      const stored = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as boolean[];
        if (Array.isArray(parsed) && parsed.length === CHECKLIST_ITEMS.length) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return CHECKLIST_ITEMS.map(() => false);
  });

  function toggleChecklist(index: number) {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      try {
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  // ── Section 5: Frontend env vars ───────────────────────────────────────────
  const frontendEnvVars = [
    {
      key: "NEXT_PUBLIC_API_URL",
      value: process.env.NEXT_PUBLIC_API_URL,
    },
    {
      key: "NEXT_PUBLIC_AGORA_APP_ID",
      value: process.env.NEXT_PUBLIC_AGORA_APP_ID,
    },
    {
      key: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
      value: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-24">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-amber-400">SkillSwap — Integration Tests</h1>
            <p className="text-xs text-slate-500 mt-0.5">Check all API connections before building features</p>
          </div>
          <button
            onClick={() => void fetchHealth()}
            className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            Refresh All
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">

        {/* ── Section 1: Auto Checks ─────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">
            <span className="text-amber-400">01</span> Auto Checks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {serviceCards.map((card) => {
              const status = getServiceStatus(card.key);
              return (
                <div
                  key={card.key}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3 text-slate-300">
                    {card.icon}
                    <span className="text-sm font-medium">{card.label}</span>
                  </div>
                  <StatusBadge status={status} />
                  {!healthLoading && healthData && (status === "error" || status === "missing") && (
                    <p className="text-xs text-red-400">Service unavailable or not configured</p>
                  )}
                </div>
              );
            })}
          </div>
          {!healthLoading && healthData && (
            <p className="mt-3 text-xs text-slate-500">
              Last checked: {new Date(healthData.timestamp).toLocaleTimeString()}
            </p>
          )}
        </section>

        {/* ── Section 2: Manual Tests ────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">
            <span className="text-amber-400">02</span> Manual Tests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Email test */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <MailIcon /> Email (Resend)
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => void testEmail()}
                  disabled={emailLoading || !emailInput}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors"
                >
                  {emailLoading ? "Sending…" : "Send"}
                </button>
              </div>
              {emailResult && (
                <p className={`text-sm ${emailResult.ok ? "text-green-400" : "text-red-400"}`}>
                  {emailResult.ok ? "✓" : "✗"} {emailResult.message}
                  {emailResult.extra && (
                    <span className="block text-xs text-slate-500 mt-0.5">ID: {emailResult.extra}</span>
                  )}
                </p>
              )}
            </div>

            {/* Database test */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <DbIcon /> Database (Supabase)
              </div>
              <button
                onClick={() => void testDatabase()}
                disabled={dbLoading}
                className="w-full px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors"
              >
                {dbLoading ? "Testing…" : "Test Database Query"}
              </button>
              {dbResult && (
                <p className={`text-sm ${dbResult.ok ? "text-green-400" : "text-red-400"}`}>
                  {dbResult.ok ? "✓" : "✗"} {dbResult.message}
                </p>
              )}
            </div>

            {/* Cloudinary test */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <CloudIcon /> Cloudinary
              </div>
              <button
                onClick={() => void testCloudinary()}
                disabled={cloudLoading}
                className="w-full px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors"
              >
                {cloudLoading ? "Uploading…" : "Test Image Upload"}
              </button>
              {cloudResult && (
                <div>
                  <p className={`text-sm ${cloudResult.ok ? "text-green-400" : "text-red-400"}`}>
                    {cloudResult.ok ? "✓" : "✗"} {cloudResult.message}
                  </p>
                  {cloudResult.extra && (
                    <p className="text-xs text-slate-500 mt-0.5 break-all">{cloudResult.extra}</p>
                  )}
                </div>
              )}
              {cloudThumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cloudThumb}
                  alt="Cloudinary test upload thumbnail"
                  className="w-12 h-12 rounded object-cover border border-slate-600"
                />
              )}
            </div>

            {/* Socket.io test */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <SocketIcon /> Socket.io
              </div>
              <button
                onClick={() => void testSocket()}
                disabled={socketLoading}
                className="w-full px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors"
              >
                {socketLoading ? "Connecting…" : "Test WebSocket"}
              </button>
              {socketResult && (
                <p className={`text-sm ${socketResult.ok ? "text-green-400" : "text-red-400"}`}>
                  {socketResult.ok ? "✓" : "✗"} {socketResult.message}
                </p>
              )}
            </div>

            {/* Agora test */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <VideoIcon /> Agora Video
              </div>
              <button
                onClick={() => void testAgora()}
                disabled={agoraLoading}
                className="w-full px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors"
              >
                {agoraLoading ? "Generating…" : "Generate Test Token"}
              </button>
              {agoraResult && (
                <div>
                  <p className={`text-sm ${agoraResult.ok ? "text-green-400" : "text-red-400"}`}>
                    {agoraResult.ok ? "✓" : "✗"} {agoraResult.message}
                  </p>
                  {agoraResult.extra && (
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{agoraResult.extra}</p>
                  )}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ── Section 3: Auth Flow Test ──────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">
            <span className="text-amber-400">03</span> Auth Flow Test
          </h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            {/* Auth status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Current status:</span>
              {session?.user ? (
                <span className="text-sm text-green-400 font-medium">
                  ✓ Logged in as {session.user.name ?? session.user.email ?? "Unknown"}
                </span>
              ) : (
                <span className="text-sm text-slate-500">Not logged in</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.open("/register", "_blank")}
                className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-lg border border-slate-600 transition-colors"
              >
                Test Register →
              </button>
              <button
                onClick={() => window.open("/login", "_blank")}
                className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-lg border border-slate-600 transition-colors"
              >
                Test Login →
              </button>
              <button
                onClick={() => { window.location.href = "/api/auth/signin/google"; }}
                className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-lg border border-slate-600 transition-colors inline-flex items-center gap-2"
              >
                <GoogleIcon /> Test Google OAuth
              </button>
            </div>
          </div>
        </section>

        {/* ── Section 4: Full Flow Checklist ────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">
            <span className="text-amber-400">04</span> Full Flow Checklist
          </h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-2">
            {CHECKLIST_ITEMS.map((item, i) => (
              <label
                key={i}
                className="flex items-center gap-3 cursor-pointer group py-1.5"
              >
                <input
                  type="checkbox"
                  checked={checklist[i] ?? false}
                  onChange={() => toggleChecklist(i)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <span
                  className={`text-sm transition-colors ${
                    checklist[i]
                      ? "line-through text-slate-500"
                      : "text-slate-300 group-hover:text-slate-100"
                  }`}
                >
                  {item}
                </span>
              </label>
            ))}
            <p className="text-xs text-slate-600 pt-2">
              Checked {checklist.filter(Boolean).length} / {CHECKLIST_ITEMS.length} — saved to localStorage
            </p>
          </div>
        </section>

        {/* ── Section 5: Frontend Env Check ─────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">
            <span className="text-amber-400">05</span> Frontend Environment
          </h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
            {frontendEnvVars.map(({ key, value }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-mono text-slate-400">{key}</span>
                {value ? (
                  <span className="text-sm text-green-400 font-medium">✓ Configured</span>
                ) : (
                  <span className="text-sm text-red-400 font-medium">✗ Missing</span>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
