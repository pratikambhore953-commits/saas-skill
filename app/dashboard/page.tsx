"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard, SkeletonText } from "@/components/Skeleton";
import ScoreRing from "@/components/ScoreRing";
import { useAuth } from "@/context/AuthContext";
import {
  DashboardMatch,
  PublicUserProfile,
  SessionItem,
  SkillAnalysis,
  UserScoreSummary,
  getMatches,
  getMyTaskScore,
  getPublicUserProfile,
  getSessions,
  getSkillAnalysis,
} from "@/lib/api";

function getGreeting(): "Morning" | "Afternoon" | "Evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

function startOfWeek(date = new Date()): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function skillChipClass(category?: string): string {
  switch (category) {
    case "TECHNOLOGY":
      return "border-blue-400/50 bg-blue-500/15 text-blue-200";
    case "DESIGN":
      return "border-pink-400/50 bg-pink-500/15 text-pink-200";
    case "LANGUAGE":
      return "border-cyan-400/50 bg-cyan-500/15 text-cyan-200";
    case "MUSIC":
      return "border-purple-400/50 bg-purple-500/15 text-purple-200";
    case "BUSINESS":
      return "border-emerald-400/50 bg-emerald-500/15 text-emerald-200";
    default:
      return "border-slate-500/40 bg-slate-500/15 text-slate-200";
  }
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [matches, setMatches] = useState<DashboardMatch[]>([]);
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [taskScore, setTaskScore] = useState<UserScoreSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) return;

    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [profileRes, sessionsRes, matchesRes, analysisRes, taskScoreRes] = await Promise.all([
          getPublicUserProfile(user.id),
          getSessions().catch(() => [] as SessionItem[]),
          getMatches().catch(() => [] as DashboardMatch[]),
          getSkillAnalysis().catch(() => null),
          getMyTaskScore().catch(() => null),
        ]);

        if (!active) return;
        setProfile(profileRes);
        setSessions(sessionsRes);
        setMatches(matchesRes);
        setAnalysis(analysisRes);
        setTaskScore(taskScoreRes);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Failed to load dashboard";
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [isAuthenticated, isLoading, user?.id]);

  if (isLoading || !isAuthenticated) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-slate-300">Loading dashboard...</div>;
  }

  if (loading || !profile) {
    return (
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-10">
        <SkeletonCard className="h-36" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} className="h-28" />
          ))}
        </div>
        <SkeletonCard className="h-44" />
      </div>
    );
  }

  const greeting = getGreeting();
  const offeredSkills = profile.skills.filter((skill) => skill.is_offering);
  const wantedSkills = profile.skills.filter((skill) => !skill.is_offering);

  const missing: string[] = [];
  if (!profile.avatar_url) missing.push("Profile photo");
  if (!(profile.about_me ?? profile.bio)) missing.push("About section");
  if (!profile.location) missing.push("Location");
  if (offeredSkills.length === 0) missing.push("Offered skills");
  if (wantedSkills.length === 0) missing.push("Learning goals");

  const profileCompletion = Math.max(0, 100 - Math.round((missing.length / 5) * 100));

  const weekStart = startOfWeek();
  const sessionsThisWeek = sessions.filter(
    (session) => new Date(session.date) >= weekStart && session.status !== "CANCELLED",
  ).length;

  const upcomingSessions = [...sessions]
    .filter((session) => new Date(session.date).getTime() >= Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const activityFeed = [
    sessions[0]
      ? {
          id: `session-${sessions[0].id}`,
          icon: "📅",
          text: `Session ${sessions[0].status.toLowerCase()} for ${sessions[0].skill.name}`,
          time: timeAgo(sessions[0].updated_at),
        }
      : null,
    offeredSkills[0]
      ? {
          id: `skill-${offeredSkills[0].id}`,
          icon: "✨",
          text: `Added ${offeredSkills[0].name} to offered skills`,
          time: "Recently",
        }
      : null,
    taskScore
      ? {
          id: "task-score",
          icon: "🏆",
          text: `Task score updated to ${taskScore.total_points} points`,
          time: "Recently",
        }
      : null,
    matches[0]
      ? {
          id: `match-${matches[0].id}`,
          icon: "🤝",
          text: `New match found with ${matches[0].name}`,
          time: "Recently",
        }
      : null,
    {
      id: "analysis",
      icon: "🧠",
      text: analysis
        ? `AI profile score is ${analysis.profile_score}/100`
        : "Run AI analysis to unlock growth roadmap",
      time: analysis ? timeAgo(analysis.updated_at) : "Pending",
    },
  ].filter(Boolean) as Array<{ id: string; icon: string; text: string; time: string }>;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h1 className="text-3xl font-black tracking-tight text-white">
          Good {greeting}, {profile.name}
        </h1>
        <p className="mt-2 text-sm text-slate-300">Your profile is {profileCompletion}% complete.</p>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${profileCompletion}%` }} />
        </div>
        {missing.length > 0 ? (
          <p className="mt-2 text-xs text-slate-400">Missing: {missing.join(", ")}</p>
        ) : (
          <p className="mt-2 text-xs text-emerald-300">Profile complete. You are ready to grow faster.</p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Matches" value={matches.length} trend="+12%" iconColor="bg-teal-500/20 text-teal-300" icon="🤝" />
        <StatCard title="Skills Offered" value={offeredSkills.length} trend="+8%" iconColor="bg-amber-500/20 text-amber-300" icon="🧩" />
        <StatCard title="Sessions This Week" value={sessionsThisWeek} trend="+5%" iconColor="bg-blue-500/20 text-blue-300" icon="📅" />
        <StatCard
          title="Task Score"
          value={taskScore?.total_points ?? 0}
          trend={taskScore?.badge ?? "BEGINNER"}
          iconColor="bg-violet-500/20 text-violet-300"
          icon="🏅"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction href="/matches" label="Find Matches" icon="🤝" />
        <QuickAction href="/browse" label="Browse Skills" icon="🔎" />
        <QuickAction href="/tasks" label="View Tasks" icon="📋" />
        <QuickAction href="/analysis" label="Analyse Profile" icon="🧠" />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">My Skills</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Offering</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {offeredSkills.map((skill) => (
                    <span key={skill.id} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${skillChipClass(skill.category)}`}>
                      {skill.name}
                    </span>
                  ))}
                  {offeredSkills.length === 0 && <p className="text-sm text-slate-400">No offered skills yet.</p>}
                  <Link
                    href="/profile/edit"
                    className="rounded-full border border-dashed border-amber-500/60 px-3 py-1.5 text-xs font-semibold text-amber-300"
                  >
                    + Add Skill
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Wanting to Learn</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {wantedSkills.map((skill) => (
                    <span key={skill.id} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${skillChipClass(skill.category)}`}>
                      {skill.name}
                    </span>
                  ))}
                  {wantedSkills.length === 0 && <p className="text-sm text-slate-400">No learning goals yet.</p>}
                  <Link
                    href="/profile/edit"
                    className="rounded-full border border-dashed border-amber-500/60 px-3 py-1.5 text-xs font-semibold text-amber-300"
                  >
                    + Add Skill
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">Upcoming Sessions</h2>
            <div className="mt-4 space-y-3">
              {upcomingSessions.length === 0 ? (
                <EmptyState
                  title="No sessions yet"
                  message="Book your first session with a match and start learning together."
                  actionLabel="Find Matches"
                  actionLink="/matches"
                />
              ) : (
                upcomingSessions.map((session) => {
                  const otherUser = session.teacher.id === user?.id ? session.requester : session.teacher;
                  return (
                    <article key={session.id} className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{session.skill.name}</p>
                          <p className="text-xs text-slate-400">with {otherUser.name}</p>
                        </div>
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
                          {session.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{formatDateTime(session.date)}</p>
                      <div className="mt-3 flex gap-2">
                        {session.meeting_link ? (
                          <a
                            href={session.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white"
                          >
                            Join
                          </a>
                        ) : (
                          <Link href="/sessions" className="inline-flex min-h-10 items-center rounded-lg border border-slate-600 px-3 text-xs font-semibold text-slate-200">
                            View
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Recent Matches</h2>
              <Link href="/matches" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
                View All Matches
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.slice(0, 3).map((match) => (
                <article key={match.id} className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                  <p className="font-semibold text-white">{match.name}</p>
                  <p className="mt-1 text-xs text-slate-400">Offers: {match.theyOffer}</p>
                </article>
              ))}
              {matches.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <EmptyState
                    title="No matches yet"
                    message="Add skills to get matched with people who can teach what you need."
                    actionLabel="Add Skills"
                    actionLink="/profile/edit"
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">AI Score</h2>
            <div className="mt-4 flex items-center justify-center">
              {analysis ? (
                <ScoreRing score={analysis.profile_score} size={130} animated />
              ) : (
                <div className="text-center">
                  <SkeletonText className="mx-auto h-24 w-24 rounded-full" />
                  <p className="mt-3 text-sm text-slate-300">No analysis yet</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/analysis"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-black hover:bg-amber-400"
              >
                {analysis ? "View Analysis" : "Analyse Now"}
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <div className="mt-4 space-y-3">
              {activityFeed.slice(0, 5).map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5">
                  <p className="text-sm text-slate-200">
                    <span className="mr-1">{item.icon}</span>
                    {item.text}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{item.time}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
  iconColor,
  icon,
}: {
  title: string;
  value: string | number;
  trend: string;
  iconColor: string;
  icon: string;
}) {
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex items-start justify-between">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg ${iconColor}`}>{icon}</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
          <span>↗</span>
          {trend}
        </span>
      </div>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="text-sm text-slate-400">{title}</p>
    </article>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 text-sm font-semibold text-slate-100 transition hover:border-amber-400/70 hover:text-amber-200"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
