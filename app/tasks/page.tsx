"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getTaskBoard,
  type SkillCategory,
  type TaskBoardItem,
  type TaskBoardStats,
  type TaskDifficulty,
} from "@/lib/api";

const categoryOptions: Array<"ALL" | SkillCategory> = [
  "ALL",
  "TECHNOLOGY",
  "DESIGN",
  "LANGUAGE",
  "MUSIC",
  "BUSINESS",
  "OTHER",
];

const difficultyOptions: Array<"ALL" | TaskDifficulty> = ["ALL", "EASY", "MEDIUM", "HARD"];
const sortOptions = ["Latest", "Most Points", "Deadline"] as const;

type SortMode = (typeof sortOptions)[number];

function difficultyClass(difficulty: TaskDifficulty): string {
  if (difficulty === "EASY") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (difficulty === "MEDIUM") return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  return "bg-rose-500/20 text-rose-300 border-rose-500/40";
}

function formatRemainingTime(remainingMs: number | null): string {
  if (remainingMs === null) return "No deadline";
  if (remainingMs <= 0) return "Deadline passed";

  const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days <= 0) {
    return `${hours}h remaining`;
  }

  return `${days}d ${hours}h remaining`;
}

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState<TaskBoardItem[]>([]);
  const [stats, setStats] = useState<TaskBoardStats>({
    active_tasks: 0,
    companies: 0,
    total_submissions: 0,
    average_score: 0,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"ALL" | SkillCategory>("ALL");
  const [difficulty, setDifficulty] = useState<"ALL" | TaskDifficulty>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("Latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getTaskBoard({
          category: category === "ALL" ? undefined : category,
          difficulty: difficulty === "ALL" ? undefined : difficulty,
          status: "ACTIVE",
          search: search.trim() || undefined,
        });
        setTasks(result.tasks);
        setStats(result.stats);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    void loadTasks();
  }, [category, difficulty, search]);

  const sortedTasks = useMemo(() => {
    const next = [...tasks];

    if (sortMode === "Most Points") {
      return next.sort((a, b) => b.points - a.points);
    }

    if (sortMode === "Deadline") {
      return next.sort((a, b) => {
        const aTime = a.remaining_ms ?? Number.MAX_SAFE_INTEGER;
        const bTime = b.remaining_ms ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
    }

    return next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [tasks, sortMode]);

  return (
    <div className="relative overflow-hidden bg-[#0D1324]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(245,158,11,0.2),transparent_36%),radial-gradient(circle_at_90%_0%,rgba(148,163,184,0.15),transparent_40%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-10">
        <section className="rounded-3xl border border-slate-700/80 bg-slate-900/70 p-8 backdrop-blur">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Company Task Board</h1>
          <p className="mt-2 text-slate-300">Complete real tasks from companies. Get scored. Get hired.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <StatCard title="Active Tasks" value={stats.active_tasks} />
            <StatCard title="Companies" value={stats.companies} />
            <StatCard title="Total Submissions" value={stats.total_submissions} />
            <StatCard title="Average Score" value={`${stats.average_score}%`} />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 backdrop-blur">
          <div className="grid gap-3 lg:grid-cols-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks, company, keywords"
              className="w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent focus:ring-amber-500/40"
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as "ALL" | SkillCategory)}
              className="rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All Categories" : option}
                </option>
              ))}
            </select>

            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as "ALL" | TaskDifficulty)}
              className="rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none"
            >
              {difficultyOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All Difficulty" : option}
                </option>
              ))}
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl border border-slate-700 bg-slate-800/60" />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-rose-700/60 bg-rose-900/20 p-4 text-rose-200">{error}</div>
        )}

        {!loading && !error && sortedTasks.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/70 p-8 text-center text-slate-300">
            No tasks found for current filters.
          </div>
        )}

        {!loading && !error && sortedTasks.length > 0 && (
          <motion.section
            className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08 },
              },
            }}
          >
            {sortedTasks.map((task) => (
              <motion.article
                key={task.id}
                className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-5 transition-all hover:-translate-y-1 hover:border-amber-400/70 hover:shadow-[0_0_30px_rgba(245,158,11,0.18)]"
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-sm font-bold text-amber-300">
                    {task.company.logo_url ? (
                      <img src={task.company.logo_url} alt={task.company.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      task.company.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-200">{task.company.name}</p>
                </div>

                <h3 className="mt-4 text-xl font-semibold text-white">{task.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-300">{task.description}</p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-amber-300">
                    {task.category}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 ${difficultyClass(task.difficulty)}`}>
                    {task.difficulty}
                  </span>
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 font-semibold text-amber-200">
                    {task.points} XP
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs">
                  <span className={task.is_urgent ? "text-rose-300" : "text-slate-400"}>
                    {formatRemainingTime(task.remaining_ms)}
                  </span>
                  <span className="text-slate-400">{task.submission_count} submitted</span>
                </div>

                <Link
                  href={`/tasks/${task.id}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
                >
                  View Task
                </Link>
              </motion.article>
            ))}
          </motion.section>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="rounded-xl border border-slate-700 bg-[#0F172A] p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-amber-300">{value}</p>
    </article>
  );
}
