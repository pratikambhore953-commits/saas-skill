"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import {
  DashboardMatch,
  SkillAnalysis,
  SkillIntent,
  SkillItem,
  SkillLevel,
  SessionItem,
  getDashboardStats,
  getInitialUserSkills,
  getRecommendedMatches,
  getSessions,
  getSkillAnalysis,
} from "@/lib/api";
import ScoreRing from "@/components/ScoreRing";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Skeleton";
import toast from "react-hot-toast";

const categories = ["Development", "Design", "Communication", "Analytics", "Business"];
const levels: SkillLevel[] = ["Beginner", "Intermediate", "Advanced"];

function getGreeting(name?: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  return `Good ${part}${name ? `, ${name}` : ""}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { user } = useAuth();

  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [matches, setMatches] = useState<DashboardMatch[]>([]);
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [level, setLevel] = useState<SkillLevel>("Beginner");
  const [intent, setIntent] = useState<SkillIntent>("offering");
  const [description, setDescription] = useState("");
  const [stats, setStats] = useState({ activeMatches: 0, skillsOffered: 0, sessionsThisWeek: 0, profileScore: 0 });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [initialSkills, recommended, sessionRows] = await Promise.all([
          getInitialUserSkills(),
          getRecommendedMatches(),
          getSessions().catch(() => []),
        ]);

        if (!mounted) return;
        setSkills(initialSkills);
        setMatches(recommended);
        setSessions(sessionRows);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    getDashboardStats(skills).then((value) => {
      const thisWeekCount = sessions.filter((item) => {
        const date = new Date(item.date).getTime();
        const now = Date.now();
        return date >= now && date <= now + 7 * 24 * 60 * 60 * 1000;
      }).length;

      setStats({
        activeMatches: value.activeMatches,
        skillsOffered: value.skillsOffered,
        sessionsThisWeek: thisWeekCount,
        profileScore: value.profileScore,
      });
    });
  }, [skills, sessions]);

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) {
      setAnalysis(null);
      return;
    }

    getSkillAnalysis(token)
      .then(setAnalysis)
      .catch(() => setAnalysis(null));
  }, [session?.accessToken]);

  const offeredSkills = useMemo(() => skills.filter((item) => item.intent === "offering"), [skills]);
  const wantedSkills = useMemo(() => skills.filter((item) => item.intent === "wanting"), [skills]);
  const upcomingSessions = useMemo(
    () =>
      [...sessions]
        .filter((item) => new Date(item.date).getTime() >= Date.now())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3),
    [sessions],
  );

  const profileCompletion = useMemo(() => {
    let score = 40;
    if (user?.bio) score += 15;
    if (user?.location) score += 15;
    if (skills.length > 0) score += 20;
    if (analysis) score += 10;
    return Math.min(100, score);
  }, [analysis, skills.length, user?.bio, user?.location]);

  const addSkill = (event: FormEvent) => {
    event.preventDefault();
    setSkills((prev) => [
      {
        id: `skill-${Date.now()}`,
        name,
        category,
        level,
        intent,
        description,
      },
      ...prev,
    ]);
    setIsModalOpen(false);
    setName("");
    setCategory(categories[0]);
    setLevel("Beginner");
    setIntent("offering");
    setDescription("");
    toast.success("Skill added successfully");
  };

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-semibold text-white">{getGreeting(user.name)}</h1>
        <p className="mt-2 text-sm text-slate-300">Your profile is {profileCompletion}% complete</p>
        <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
          <div className="h-2 rounded-full bg-amber-500" style={{ width: `${profileCompletion}%` }} />
        </div>
      </header>

      {loading ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
      ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Matches" value={stats.activeMatches} color="text-teal-300" trend="↗" />
          <StatCard title="Skills Offered" value={stats.skillsOffered} color="text-amber-300" trend="↗" />
          <StatCard title="Session This Week" value={stats.sessionsThisWeek} color="text-blue-300" trend="→" />
          <StatCard title="Task Score" value={`${stats.profileScore}%`} color="text-purple-300" trend="↗" />
        </section>
      )}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction href="/matches" label="Find Matches" icon="🤝" />
        <QuickAction href="/browse" label="Browse Skills" icon="🔎" />
        <QuickAction href="/tasks" label="View Tasks" icon="✅" />
        <QuickAction href="/analysis" label="Analyse Profile" icon="✨" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <SkillColumn title="Offering" items={offeredSkills} onAdd={() => setIsModalOpen(true)} />
        <SkillColumn title="Wanting to Learn" items={wantedSkills} onAdd={() => setIsModalOpen(true)} />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="text-xl font-semibold text-white">Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<span>📅</span>}
              title="No sessions yet"
              message="Book your first session from matches or profile pages."
              actionLabel="Browse Matches"
              actionLink="/matches"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {upcomingSessions.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">{item.skill.name}</p>
                  <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-300">{item.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-300">{formatDate(item.date)}</p>
                <Link href="/sessions" className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:border-amber-500 hover:text-amber-300">
                  {item.mode === "ONLINE" ? "Join" : "View"}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Matches</h2>
            <Link href="/matches" className="text-sm font-semibold text-amber-300 hover:text-amber-200">View All Matches</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {matches.slice(0, 3).map((match) => (
              <article key={match.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                <p className="font-semibold text-white">{match.name}</p>
                <p className="mt-1 text-xs text-slate-400">{match.location}</p>
                <p className="mt-2 text-sm text-slate-300">Offers: {match.theyOffer}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="text-xl font-semibold text-white">AI Score</h2>
          {analysis ? (
            <div className="mt-4 flex items-center justify-center">
              <ScoreRing score={analysis.profile_score} size={130} animated />
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-slate-300">No analysis yet.</p>
              <Link href="/analysis" className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400">
                Analyse Profile
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
        <div className="mt-4 space-y-3">
          {[
            "Session booked with Maya Rao",
            "Skill added: Public Speaking",
            "Task submitted for React Assessment",
            "New skill match found",
            "Profile updated successfully",
          ].map((entry, index) => (
            <div key={entry} className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <span className="text-amber-300">•</span>
              <div className="flex-1">
                <p className="text-sm text-slate-100">{entry}</p>
                <p className="mt-1 text-xs text-slate-500">Activity</p>
              </div>
              <p className="text-xs text-slate-500">{index + 1}h ago</p>
            </div>
          ))}
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <form onSubmit={addSkill} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">Add Skill</h3>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Skill name"
              className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select value={level} onChange={(event) => setLevel(event.target.value as SkillLevel)} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
                {levels.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm text-slate-200">
              <label><input type="radio" checked={intent === "offering"} onChange={() => setIntent("offering")} /> Offering</label>
              <label><input type="radio" checked={intent === "wanting"} onChange={() => setIntent("wanting")} /> Wanting</label>
            </div>
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              className="mt-3 h-24 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex min-h-11 items-center rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300">Cancel</button>
              <button type="submit" className="inline-flex min-h-11 items-center rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black">Add Skill</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ title, value, color, trend }: { title: string; value: string | number; color: string; trend: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <div className="mt-1 flex items-center justify-between">
        <p className={`text-2xl font-semibold ${color}`}>{value}</p>
        <span className="text-xs text-slate-400">{trend}</span>
      </div>
    </div>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-amber-500 hover:text-amber-300">
      <span>{icon}</span>
      {label}
    </Link>
  );
}

function SkillColumn({ title, items, onAdd }: { title: string; items: SkillItem[]; onAdd: () => void }) {
  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((skill) => (
          <span key={skill.id} className="rounded-full border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200">
            {skill.name}
          </span>
        ))}
        <button type="button" onClick={onAdd} className="rounded-full border border-dashed border-amber-500/60 px-3 py-1.5 text-sm text-amber-300">
          + Add Skill
        </button>
      </div>
    </section>
  );
}
