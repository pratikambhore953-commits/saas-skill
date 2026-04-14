"use client";

import { useEffect, useMemo, useState } from "react";
import { io as createSocket, type Socket } from "socket.io-client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

type ServiceKey = "database" | "resend" | "google_oauth" | "cloudinary" | "agora" | "jwt" | "socket_io";
type ServiceState = "checking" | "connected" | "error";

type HealthApiResponse = {
  status: "ok" | "error";
  timestamp: string;
  services: Record<ServiceKey, string>;
};

type ServiceCard = {
  key: ServiceKey;
  name: string;
  description: string;
};

type ChecklistItem = {
  id: string;
  label: string;
};

type EnvCheck = {
  key: string;
  configured: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? API_BASE;
const CHECKLIST_STORAGE_KEY = "skillswap-integration-checklist";

const serviceCards: ServiceCard[] = [
  { key: "database", name: "Database", description: "Supabase PostgreSQL" },
  { key: "resend", name: "Email", description: "Resend" },
  { key: "google_oauth", name: "Google OAuth", description: "Google sign in" },
  { key: "cloudinary", name: "Cloudinary", description: "Media uploads" },
  { key: "agora", name: "Agora Video", description: "Realtime video" },
  { key: "jwt", name: "JWT Auth", description: "Access + refresh" },
  { key: "socket_io", name: "Socket.io", description: "Realtime chat" },
];

const checklistItems: ChecklistItem[] = [
  { id: "register", label: "User can register with email + password" },
  { id: "login", label: "User can login with email + password" },
  { id: "google", label: "User can login with Google" },
  { id: "otp", label: "User can receive OTP email" },
  { id: "avatar", label: "User can upload profile photo" },
  { id: "skills", label: "User can add skills" },
  { id: "browse", label: "User can browse other users" },
  { id: "session", label: "User can book a session" },
  { id: "chat", label: "User can chat in real time" },
  { id: "video", label: "Video call connects" },
  { id: "notifications", label: "Email notifications arrive" },
];

function serviceStateFromBackend(value: string): ServiceState {
  if (value === "connected" || value === "configured" || value === "running") {
    return "connected";
  }
  return "error";
}

function ServiceIcon({ service }: { service: ServiceKey }) {
  switch (service) {
    case "database":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <ellipse cx="12" cy="5" rx="7" ry="3" />
          <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
          <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </svg>
      );
    case "resend":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case "google_oauth":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
      );
    case "cloudinary":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 16a4 4 0 1 1 1.1-7.8A5 5 0 0 1 17.6 10 3.5 3.5 0 1 1 18 17H8" />
        </svg>
      );
    case "agora":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="6" width="14" height="12" rx="2" />
          <path d="m17 10 4-2v8l-4-2" />
        </svg>
      );
    case "jwt":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3 4 7v6c0 5 3.4 7.8 8 9 4.6-1.2 8-4 8-9V7l-8-4Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "socket_io":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 12a7 7 0 0 1 14 0" />
          <path d="M8 12a4 4 0 0 1 8 0" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

export default function IntegrationTestPage() {
  const { user, isAuthenticated } = useAuth();
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState<string>("");
  const [serviceStates, setServiceStates] = useState<Record<ServiceKey, ServiceState>>({
    database: "checking",
    resend: "checking",
    google_oauth: "checking",
    cloudinary: "checking",
    agora: "checking",
    jwt: "checking",
    socket_io: "checking",
  });
  const [serviceNotes, setServiceNotes] = useState<Record<ServiceKey, string>>({
    database: "",
    resend: "",
    google_oauth: "",
    cloudinary: "",
    agora: "",
    jwt: "",
    socket_io: "",
  });

  const [emailTo, setEmailTo] = useState(user?.email ?? "");
  const [emailResult, setEmailResult] = useState<string>("");
  const [dbResult, setDbResult] = useState<string>("");
  const [cloudinaryResult, setCloudinaryResult] = useState<string>("");
  const [cloudinaryPreviewUrl, setCloudinaryPreviewUrl] = useState<string>("");
  const [socketResult, setSocketResult] = useState<string>("");
  const [agoraResult, setAgoraResult] = useState<string>("");

  const [socketClient, setSocketClient] = useState<Socket | null>(null);
  const [liveSocketState, setLiveSocketState] = useState<"connected" | "disconnected">("disconnected");

  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const [busy, setBusy] = useState<Record<string, boolean>>({
    email: false,
    database: false,
    cloudinary: false,
    socket: false,
    agora: false,
    google: false,
  });

  const envChecks = useMemo<EnvCheck[]>(
    () => [
      { key: "NEXT_PUBLIC_API_URL", configured: Boolean(process.env.NEXT_PUBLIC_API_URL) },
      { key: "NEXT_PUBLIC_AGORA_APP_ID", configured: Boolean(process.env.NEXT_PUBLIC_AGORA_APP_ID) },
      {
        key: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
        configured: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
      },
    ],
    [],
  );

  useEffect(() => {
    if (user?.email && !emailTo) {
      setEmailTo(user.email);
    }
  }, [user, emailTo]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>;
        setChecklist(parsed);
      }
    } catch {
      setChecklist({});
    }
  }, []);

  useEffect(() => {
    async function runHealthCheck(): Promise<void> {
      try {
        setLoadingHealth(true);
        setHealthError("");

        const response = await fetch(`${API_BASE}/api/health`);
        const body = (await response.json()) as HealthApiResponse & { error?: string };

        const nextStates: Record<ServiceKey, ServiceState> = {
          database: serviceStateFromBackend(body.services.database),
          resend: serviceStateFromBackend(body.services.resend),
          google_oauth: serviceStateFromBackend(body.services.google_oauth),
          cloudinary: serviceStateFromBackend(body.services.cloudinary),
          agora: serviceStateFromBackend(body.services.agora),
          jwt: serviceStateFromBackend(body.services.jwt),
          socket_io: serviceStateFromBackend(body.services.socket_io),
        };

        const nextNotes: Record<ServiceKey, string> = {
          database: body.services.database,
          resend: body.services.resend,
          google_oauth: body.services.google_oauth,
          cloudinary: body.services.cloudinary,
          agora: body.services.agora,
          jwt: body.services.jwt,
          socket_io: body.services.socket_io,
        };

        setServiceStates(nextStates);
        setServiceNotes(nextNotes);

        if (!response.ok && body.error) {
          setHealthError(body.error);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Health request failed";
        setHealthError(message);
        setServiceStates({
          database: "error",
          resend: "error",
          google_oauth: "error",
          cloudinary: "error",
          agora: "error",
          jwt: "error",
          socket_io: "error",
        });
      } finally {
        setLoadingHealth(false);
      }
    }

    void runHealthCheck();
  }, []);

  useEffect(() => {
    return () => {
      if (socketClient) {
        socketClient.disconnect();
      }
    };
  }, [socketClient]);

  function updateChecklist(id: string, checked: boolean): void {
    setChecklist((prev) => {
      const next = { ...prev, [id]: checked };
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleTestEmail(): Promise<void> {
    try {
      setBusy((prev) => ({ ...prev, email: true }));
      setEmailResult("");

      const response = await fetch(`${API_BASE}/api/health/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTo }),
      });

      const body = (await response.json()) as { sent: boolean; message_id?: string; error?: string };
      if (!response.ok || !body.sent) {
        throw new Error(body.error ?? "Email test failed");
      }

      setEmailResult(`Email sent! Check your inbox. Message ID: ${body.message_id ?? "unknown"}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email test failed";
      setEmailResult(`Error: ${message}`);
    } finally {
      setBusy((prev) => ({ ...prev, email: false }));
    }
  }

  async function handleTestDatabase(): Promise<void> {
    try {
      setBusy((prev) => ({ ...prev, database: true }));
      setDbResult("");

      const response = await fetch(`${API_BASE}/api/health/database`);
      const body = (await response.json()) as { connected: boolean; users_count?: number; error?: string };
      if (!response.ok || !body.connected) {
        throw new Error(body.error ?? "Database check failed");
      }

      setDbResult(`Connected — ${body.users_count ?? 0} users in database`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Database test failed";
      setDbResult(`Error: ${message}`);
    } finally {
      setBusy((prev) => ({ ...prev, database: false }));
    }
  }

  async function handleTestCloudinary(): Promise<void> {
    try {
      setBusy((prev) => ({ ...prev, cloudinary: true }));
      setCloudinaryResult("");
      setCloudinaryPreviewUrl("");

      const response = await fetch(`${API_BASE}/api/health/test-cloudinary`, { method: "POST" });
      const body = (await response.json()) as { uploaded: boolean; url?: string; error?: string };
      if (!response.ok || !body.uploaded || !body.url) {
        throw new Error(body.error ?? "Cloudinary test failed");
      }

      setCloudinaryPreviewUrl(body.url);
      setCloudinaryResult(`Upload working — ${body.url}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloudinary test failed";
      setCloudinaryResult(`Error: ${message}`);
    } finally {
      setBusy((prev) => ({ ...prev, cloudinary: false }));
    }
  }

  async function handleTestSocket(): Promise<void> {
    try {
      setBusy((prev) => ({ ...prev, socket: true }));
      setSocketResult("");

      if (socketClient) {
        socketClient.disconnect();
      }

      const token = localStorage.getItem("skillswap_access_token") ?? localStorage.getItem("skillswap_token") ?? "";
      const client = createSocket(SOCKET_URL, {
        transports: ["websocket", "polling"],
        auth: {
          token,
          healthCheck: true,
        },
        withCredentials: true,
      });

      setSocketClient(client);

      client.on("connect", () => {
        setLiveSocketState("connected");
      });

      client.on("disconnect", () => {
        setLiveSocketState("disconnected");
      });

      const response = await fetch(`${API_BASE}/api/health/test-socket`);
      const body = (await response.json()) as { running: boolean; connected_clients: number; error?: string };
      if (!response.ok || !body.running) {
        throw new Error(body.error ?? "Socket health check failed");
      }

      setSocketResult(`WebSocket connected — ${body.connected_clients} clients online`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Socket test failed";
      setSocketResult(`Error: ${message}`);
      setLiveSocketState("disconnected");
    } finally {
      setBusy((prev) => ({ ...prev, socket: false }));
    }
  }

  async function handleTestAgora(): Promise<void> {
    try {
      setBusy((prev) => ({ ...prev, agora: true }));
      setAgoraResult("");

      const response = await fetch(`${API_BASE}/api/health/test-agora`);
      const body = (await response.json()) as { generated: boolean; token?: string; error?: string };
      if (!response.ok || !body.generated || !body.token) {
        throw new Error(body.error ?? "Agora token generation failed");
      }

      setAgoraResult(`Token generated successfully — ${body.token.slice(0, 20)}...`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agora test failed";
      setAgoraResult(`Error: ${message}`);
    } finally {
      setBusy((prev) => ({ ...prev, agora: false }));
    }
  }

  async function handleGoogleTest(): Promise<void> {
    try {
      setBusy((prev) => ({ ...prev, google: true }));
      await signIn("google", { callbackUrl: "/test" });
    } catch {
      setBusy((prev) => ({ ...prev, google: false }));
    }
  }

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-20">
        <div className="rounded-2xl border border-red-400/40 bg-slate-900/80 p-8 text-center text-slate-200">
          <h1 className="text-2xl font-bold text-red-300">Integration dashboard is disabled</h1>
          <p className="mt-2 text-sm text-slate-300">This page only works in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(245,158,11,0.22),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(251,191,36,0.14),transparent_30%),linear-gradient(180deg,#020617,#0F172A_45%,#111827)] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-6 shadow-[0_0_0_1px_rgba(245,158,11,0.16),0_20px_60px_-35px_rgba(245,158,11,0.65)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Developer Console</p>
          <h1 className="mt-2 text-3xl font-black text-amber-100">SkillSwap — Integration Tests</h1>
          <p className="mt-2 text-slate-300">Check all API connections before building features.</p>
        </header>

        <section className="space-y-4 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-200">Section 1 — Auto checks</h2>
            <span className="text-xs uppercase tracking-[0.15em] text-slate-400">Runs on load</span>
          </div>
          {healthError ? <p className="text-sm text-red-300">Health error: {healthError}</p> : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceCards.map((service) => {
              const state = loadingHealth ? "checking" : serviceStates[service.key];
              const badgeColor =
                state === "connected"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : state === "error"
                    ? "bg-red-500/15 text-red-300"
                    : "bg-amber-500/20 text-amber-200";
              const dotColor =
                state === "connected"
                  ? "bg-emerald-400"
                  : state === "error"
                    ? "bg-red-400"
                    : "bg-amber-300";
              const badgeText = state === "connected" ? "Connected" : state === "error" ? "Error" : "Checking...";

              return (
                <article
                  key={service.key}
                  className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-200">
                        <ServiceIcon service={service.key} />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">{service.name}</h3>
                        <p className="text-xs text-slate-400">{service.description}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeColor}`}>{badgeText}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <span className={`h-2.5 w-2.5 animate-pulse rounded-full ${dotColor}`} />
                    <span>{serviceNotes[service.key]}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6">
          <h2 className="text-xl font-bold text-amber-200">Section 2 — Manual tests</h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700/70 bg-slate-800/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Test Email</h3>
              <div className="mt-3 flex gap-2">
                <input
                  value={emailTo}
                  onChange={(event) => setEmailTo(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-amber-300/40 focus:ring"
                />
                <button
                  onClick={() => void handleTestEmail()}
                  disabled={busy.email}
                  className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {busy.email ? "Sending..." : "Send Test Email"}
                </button>
              </div>
              {emailResult ? <p className="mt-2 text-xs text-slate-300">{emailResult}</p> : null}
            </div>

            <div className="rounded-xl border border-slate-700/70 bg-slate-800/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Test Database</h3>
              <button
                onClick={() => void handleTestDatabase()}
                disabled={busy.database}
                className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {busy.database ? "Testing..." : "Test Database Query"}
              </button>
              {dbResult ? <p className="mt-2 text-xs text-slate-300">{dbResult}</p> : null}
            </div>

            <div className="rounded-xl border border-slate-700/70 bg-slate-800/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Test Cloudinary</h3>
              <button
                onClick={() => void handleTestCloudinary()}
                disabled={busy.cloudinary}
                className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {busy.cloudinary ? "Uploading..." : "Test Image Upload"}
              </button>
              {cloudinaryResult ? <p className="mt-2 text-xs text-slate-300 break-all">{cloudinaryResult}</p> : null}
              {cloudinaryPreviewUrl ? (
                <Image
                  src={cloudinaryPreviewUrl}
                  alt="Cloudinary test upload"
                  width={56}
                  height={56}
                  unoptimized
                  className="mt-3 h-14 w-14 rounded-md border border-slate-600"
                />
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-700/70 bg-slate-800/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Test Socket.io</h3>
              <button
                onClick={() => void handleTestSocket()}
                disabled={busy.socket}
                className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {busy.socket ? "Connecting..." : "Test WebSocket"}
              </button>
              <p className="mt-2 text-xs text-slate-300">Realtime status: {liveSocketState}</p>
              {socketResult ? <p className="mt-1 text-xs text-slate-300">{socketResult}</p> : null}
            </div>

            <div className="rounded-xl border border-slate-700/70 bg-slate-800/70 p-4 md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-100">Test Agora</h3>
              <button
                onClick={() => void handleTestAgora()}
                disabled={busy.agora}
                className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {busy.agora ? "Generating..." : "Generate Test Token"}
              </button>
              {agoraResult ? <p className="mt-2 text-xs text-slate-300 break-all">{agoraResult}</p> : null}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6">
          <h2 className="text-xl font-bold text-amber-200">Section 3 — Auth flow test</h2>
          <p className="text-sm text-slate-300">
            Current auth status: {isAuthenticated ? `logged in as ${user?.name ?? "user"}` : "not logged in"}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.open("/register", "_blank", "noopener,noreferrer")}
              className="rounded-lg border border-amber-400/50 bg-slate-800 px-3 py-2 text-sm font-semibold text-amber-200"
            >
              Test Register
            </button>
            <button
              onClick={() => window.open("/login", "_blank", "noopener,noreferrer")}
              className="rounded-lg border border-amber-400/50 bg-slate-800 px-3 py-2 text-sm font-semibold text-amber-200"
            >
              Test Login
            </button>
            <button
              onClick={() => void handleGoogleTest()}
              disabled={busy.google}
              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {busy.google ? "Starting..." : "Test Google Login"}
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6">
          <h2 className="text-xl font-bold text-amber-200">Section 4 — Full flow checklist</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {checklistItems.map((item) => (
              <label key={item.id} className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-800/60 px-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(checklist[item.id])}
                  onChange={(event) => updateChecklist(item.id, event.target.checked)}
                  className="h-4 w-4 accent-amber-500"
                />
                <span className="text-sm text-slate-200">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6">
          <h2 className="text-xl font-bold text-amber-200">Section 5 — Environment check</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {envChecks.map((item) => (
              <div key={item.key} className="rounded-lg border border-slate-700/80 bg-slate-800/60 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{item.key}</p>
                <p className={`mt-2 text-sm font-semibold ${item.configured ? "text-emerald-300" : "text-red-300"}`}>
                  {item.configured ? "Configured" : "Missing"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
