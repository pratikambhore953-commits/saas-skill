"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  getLeaderboardApi,
  getMyTaskScoreApi,
  type LeaderboardEntry,
  type MyTaskScore,
  type UserBadge,
} from "@/lib/api";

function badgeClass(badge: UserBadge): string {
  if (badge === "BEGINNER") return "bg-slate-500/20 text-slate-200 border-slate-400/40";
  if (badge === "INTERMEDIATE") return "bg-sky-500/20 text-sky-200 border-sky-400/40";
  if (badge === "ADVANCED") return "bg-amber-500/20 text-amber-200 border-amber-400/40";
  if (badge === "EXPERT") return "bg-violet-500/20 text-violet-200 border-violet-400/40";
  return "bg-yellow-400/25 text-yellow-100 border-yellow-300/60 shadow-[0_0_20px_rgba(250,204,21,0.25)]";
}

const badgeThreshold: Record<UserBadge, number> = {
  BEGINNER: 0,
  INTERMEDIATE: 100,
  ADVANCED: 300,
  EXPERT: 600,
  MASTER: 1000,
};

function nextBadge(currentBadge: UserBadge): { badge: UserBadge; threshold: number } | null {
  if (currentBadge === "BEGINNER") return { badge: "INTERMEDIATE", threshold: 100 };
  if (currentBadge === "INTERMEDIATE") return { badge: "ADVANCED", threshold: 300 };
  if (currentBadge === "ADVANCED") return { badge: "EXPERT", threshold: 600 };
  if (currentBadge === "EXPERT") return { badge: "MASTER", threshold: 1000 };
  return null;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [myScore, setMyScore] = useState<MyTaskScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLeaderboardApi();
        setRows(data);

        try {
          const mine = await getMyTaskScoreApi();
          setMyScore(mine);
        } catch {
          setMyScore(null);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const podium = useMemo(() => {
    const first = rows[0] ?? null;
    const second = rows[1] ?? null;
    const third = rows[2] ?? null;
    return { first, second, third };
  }, [rows]);

  const myProgress = useMemo(() => {
    if (!myScore) return { percent: 0, text: "Sign in to track your progress" };

    const next = nextBadge(myScore.badge);
    if (!next) {
      return { percent: 100, text: "You reached the highest badge" };
    }

    const currentThreshold = badgeThreshold[myScore.badge];
    const range = next.threshold - currentThreshold;
    const completed = Math.max(0, myScore.total_points - currentThreshold);
    const percent = Math.min(100, Math.round((completed / range) * 100));

    return {
      percent,
      text: `${Math.max(0, next.threshold - myScore.total_points)} points to ${next.badge}`,
    };
  }, [myScore]);

  return (
    <div className="relative overflow-hidden bg-[#0E1322]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.2),transparent_36%),radial-gradient(circle_at_90%_20%,rgba(148,163,184,0.15),transparent_45%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-10">
        <section className="rounded-3xl border border-slate-700/80 bg-slate-900/70 p-8">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">SkillSwap Leaderboard</h1>
          <p className="mt-2 text-slate-300">Top performers get noticed by companies</p>
        </section>

        {loading && <div className="mt-6 h-72 animate-pulse rounded-2xl border border-slate-700 bg-slate-800/70" />}
        {error && <div className="mt-6 rounded-xl border border-rose-700/60 bg-rose-900/20 p-4 text-rose-200">{error}</div>}

        {!loading && !error && (
          <div className="mt-6 grid gap-6 xl:grid-cols-4">
            <section className="space-y-6 xl:col-span-3">
              <motion.div
                className="grid items-end gap-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-6 md:grid-cols-3"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <PodiumCard entry={podium.second} rank={2} height="h-32" accent="border-slate-400/40 bg-slate-300/10" />
                <PodiumCard
                  entry={podium.first}
                  rank={1}
                  height="h-40"
                  accent="border-yellow-400/50 bg-yellow-400/15"
                  crown
                />
                <PodiumCard entry={podium.third} rank={3} height="h-28" accent="border-amber-700/40 bg-amber-700/20" />
              </motion.div>

              <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-700 bg-slate-800/80 text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Avatar</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Badge</th>
                      <th className="px-4 py-3">Tasks Done</th>
                      <th className="px-4 py-3">Points</th>
                      <th className="px-4 py-3">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-300">
                          No leaderboard data available yet.
                        </td>
                      </tr>
                    )}

                    {rows.map((entry, index) => {
                      const isCurrentUser = user?.id === entry.user.id;
                      const tint =
                        entry.rank === 1
                          ? "bg-yellow-500/10"
                          : entry.rank === 2
                            ? "bg-slate-300/10"
                            : entry.rank === 3
                              ? "bg-amber-700/20"
                              : "";

                      return (
                        <motion.tr
                          key={entry.id}
                          className={`border-b border-slate-800 text-slate-200 ${tint} ${isCurrentUser ? "bg-amber-500/20" : ""}`}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <td className="px-4 py-3 font-semibold">#{entry.rank ?? index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-amber-200">
                              {entry.user.avatar_url ? (
                                <img
                                  src={entry.user.avatar_url}
                                  alt={entry.user.name}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                entry.user.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium">{entry.user.name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${badgeClass(entry.badge)}`}>
                              {entry.badge}
                            </span>
                          </td>
                          <td className="px-4 py-3">{entry.tasks_completed}</td>
                          <td className="px-4 py-3 font-semibold text-amber-300">{entry.total_points}</td>
                          <td className="px-4 py-3 text-slate-300">{entry.user.location ?? "N/A"}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-700 bg-slate-900/85 p-5">
              <h2 className="text-xl font-semibold text-white">My Stats</h2>
              {!myScore && <p className="mt-4 text-sm text-slate-300">Log in to see your leaderboard stats.</p>}

              {myScore && (
                <div className="mt-4 space-y-3 text-sm">
                  <StatLine label="Current Rank" value={myScore.rank ? `#${myScore.rank}` : "Unranked"} />
                  <StatLine label="Total Points" value={String(myScore.total_points)} />
                  <StatLine label="Tasks Completed" value={String(myScore.tasks_completed)} />
                  <StatLine label="Tasks Accepted" value={String(myScore.tasks_accepted)} />

                  <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Badge</p>
                    <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs ${badgeClass(myScore.badge)}`}>
                      {myScore.badge}
                    </span>
                    <p className="mt-2 text-xs text-slate-300">{myProgress.text}</p>

                    <div className="mt-2 h-2 rounded-full bg-slate-700">
                      <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${myProgress.percent}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function PodiumCard({
  entry,
  rank,
  height,
  accent,
  crown = false,
}: {
  entry: LeaderboardEntry | null;
  rank: number;
  height: string;
  accent: string;
  crown?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="mb-3 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-sm font-bold text-amber-200">
          {entry?.user.avatar_url ? (
            <img src={entry.user.avatar_url} alt={entry.user.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            entry?.user.name.slice(0, 2).toUpperCase() ?? "--"
          )}
        </div>
      </div>
      <p className="text-sm font-semibold text-white">{entry?.user.name ?? "TBD"}</p>
      <p className="text-xs text-slate-300">{entry?.total_points ?? 0} pts</p>
      <div className={`mt-3 rounded-t-xl border ${accent} ${height} flex items-center justify-center`}>
        <div>
          {crown && <p className="text-xl">Crown</p>}
          <p className="text-lg font-bold text-white">#{rank}</p>
          <p className="text-xs text-slate-200">{entry?.badge ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2">
      <span className="text-slate-300">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
