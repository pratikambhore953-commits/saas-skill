"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import {
  SessionItem,
  SessionMode,
  SessionStatus,
  getSessions,
  updateSession,
  updateSessionStatus,
} from "@/lib/api";

const tabs: Array<{ key: "ALL" | SessionStatus; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: SessionStatus): string {
  if (status === "PENDING") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  if (status === "ACCEPTED") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (status === "REJECTED") return "bg-red-500/15 text-red-300 border-red-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

function modeBadge(mode: SessionMode): string {
  return mode === "ONLINE"
    ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
    : "bg-amber-500/15 text-amber-300 border-amber-500/30";
}

type EditState = {
  date: string;
  duration_minutes: number;
  mode: SessionMode;
  description: string;
  meeting_link: string;
  location: string;
};

export default function SessionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("ALL");
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?next=/sessions");
    }
  }, [isLoading, isAuthenticated, router]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await getSessions();
      setSessions(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadSessions();
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    if (tab === "ALL") return sessions;
    return sessions.filter((session) => session.status === tab);
  }, [tab, sessions]);

  const handleStatusUpdate = async (sessionId: string, status: SessionStatus) => {
    try {
      setPendingActionId(sessionId);
      setError(null);
      const updated = await updateSessionStatus(sessionId, status);
      setSessions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (status === "ACCEPTED") {
        toast.success("Session request accepted!");
      } else if (status === "REJECTED") {
        toast.error("Session request rejected");
      } else if (status === "PENDING") {
        toast.success("Session request sent!");
      } else {
        toast.success("Session updated");
      }
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update session status");
    } finally {
      setPendingActionId(null);
    }
  };

  const openEdit = (session: SessionItem) => {
    setEditingSessionId(session.id);
    const dateObject = new Date(session.date);
    const date = `${dateObject.getFullYear()}-${`${dateObject.getMonth() + 1}`.padStart(2, "0")}-${`${dateObject.getDate()}`.padStart(2, "0")}`;
    const time = `${`${dateObject.getHours()}`.padStart(2, "0")}:${`${dateObject.getMinutes()}`.padStart(2, "0")}`;

    setEditState({
      date: `${date}T${time}`,
      duration_minutes: session.duration_minutes,
      mode: session.mode,
      description: session.description ?? "",
      meeting_link: session.meeting_link ?? "",
      location: session.location ?? "",
    });
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingSessionId || !editState) return;

    try {
      setPendingActionId(editingSessionId);
      setError(null);
      const updated = await updateSession(editingSessionId, {
        date: new Date(editState.date).toISOString(),
        duration_minutes: editState.duration_minutes,
        mode: editState.mode,
        description: editState.description || undefined,
        meeting_link: editState.mode === "ONLINE" ? editState.meeting_link || undefined : undefined,
        location: editState.mode === "OFFLINE" ? editState.location || undefined : undefined,
      });
      setSessions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingSessionId(null);
      setEditState(null);
      toast.success("Session updated");
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : "Unable to update session");
    } finally {
      setPendingActionId(null);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-slate-300">Loading sessions...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-white">My Sessions</h1>
      <p className="mt-2 text-slate-300">Manage your upcoming and completed skill exchange sessions.</p>

      <div className="mt-6 flex flex-wrap gap-2 rounded-xl border border-slate-700 bg-slate-900/60 p-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === item.key ? "bg-amber-500 text-black" : "text-slate-300 hover:bg-slate-800 hover:text-amber-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

      {loading ? (
        <p className="mt-6 text-slate-300">Loading your sessions...</p>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/50 px-6 py-10 text-center">
          <p className="text-lg text-slate-200">No {tab === "ALL" ? "sessions" : tab.toLowerCase()} sessions yet.</p>
          <p className="mt-2 text-sm text-slate-400">Book a session from profile, matches, or chat to get started.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((session) => {
            const isRequester = user?.id === session.requester_id;
            const otherUser = isRequester ? session.teacher : session.requester;

            return (
              <article key={session.id} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-amber-300">
                      {getInitials(otherUser.name)}
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">{isRequester ? "Teacher" : "Requester"}</p>
                      <h2 className="text-lg font-semibold text-white">{otherUser.name}</h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                      {session.skill.name}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${modeBadge(session.mode)}`}>
                      {session.mode}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadge(session.status)}`}>
                      {session.status}
                    </span>
                    <span className="rounded-full border border-slate-500/30 bg-slate-500/15 px-3 py-1 text-xs font-medium text-slate-300">
                      {session.duration_minutes} min
                    </span>
                  </div>
                </div>

                <h3 className="mt-4 text-base font-semibold text-white">{session.title}</h3>
                {session.description && <p className="mt-1 text-sm text-slate-300">{session.description}</p>}

                <p className="mt-3 text-sm text-slate-300">{formatDateTime(session.date)}</p>
                {session.mode === "ONLINE" && session.meeting_link && (
                  <p className="mt-1 text-sm text-slate-300">Meeting: {session.meeting_link}</p>
                )}
                {session.mode === "OFFLINE" && session.location && (
                  <p className="mt-1 text-sm text-slate-300">Location: {session.location}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {session.status === "PENDING" && !isRequester && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(session.id, "ACCEPTED")}
                        disabled={pendingActionId === session.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(session.id, "REJECTED")}
                        disabled={pendingActionId === session.id}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-70"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {session.status === "PENDING" && isRequester && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(session.id, "CANCELLED")}
                        disabled={pendingActionId === session.id}
                        className="rounded-lg border border-slate-500 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:border-amber-500 hover:text-amber-300 disabled:opacity-70"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(session)}
                        className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/20"
                      >
                        Edit
                      </button>
                    </>
                  )}

                  {session.status === "ACCEPTED" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(session.id, "CANCELLED")}
                        disabled={pendingActionId === session.id}
                        className="rounded-lg border border-slate-500 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:border-amber-500 hover:text-amber-300 disabled:opacity-70"
                      >
                        Cancel
                      </button>
                      {isRequester && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(session.id, "COMPLETED")}
                          disabled={pendingActionId === session.id}
                          className="rounded-lg border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-100 hover:border-slate-300 disabled:opacity-70"
                        >
                          Mark Complete
                        </button>
                      )}
                      {session.mode === "ONLINE" && session.meeting_link && (
                        <a
                          href={session.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
                        >
                          Join Meeting
                        </a>
                      )}
                    </>
                  )}
                </div>

                {editingSessionId === session.id && editState && (
                  <form onSubmit={submitEdit} className="mt-4 grid gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                    <h4 className="text-sm font-semibold text-amber-300">Edit Pending Session</h4>
                    <input
                      type="datetime-local"
                      value={editState.date}
                      onChange={(event) => setEditState({ ...editState, date: event.target.value })}
                      className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                      required
                    />
                    <select
                      value={editState.duration_minutes}
                      onChange={(event) => setEditState({ ...editState, duration_minutes: Number(event.target.value) })}
                      className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    >
                      {[30, 60, 90, 120].map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes} minutes
                        </option>
                      ))}
                    </select>
                    <select
                      value={editState.mode}
                      onChange={(event) => setEditState({ ...editState, mode: event.target.value as SessionMode })}
                      className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    >
                      <option value="ONLINE">Online</option>
                      <option value="OFFLINE">Offline</option>
                    </select>
                    <textarea
                      value={editState.description}
                      onChange={(event) => setEditState({ ...editState, description: event.target.value })}
                      className="h-20 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                      placeholder="Description"
                    />
                    {editState.mode === "ONLINE" ? (
                      <input
                        type="url"
                        value={editState.meeting_link}
                        onChange={(event) => setEditState({ ...editState, meeting_link: event.target.value })}
                        className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                        placeholder="Meeting link"
                      />
                    ) : (
                      <input
                        value={editState.location}
                        onChange={(event) => setEditState({ ...editState, location: event.target.value })}
                        className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                        placeholder="Location"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={pendingActionId === session.id}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-70"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSessionId(null);
                          setEditState(null);
                        }}
                        className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500"
                      >
                        Close
                      </button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
