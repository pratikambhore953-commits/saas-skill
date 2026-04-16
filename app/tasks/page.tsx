"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard, SkeletonTable } from "@/components/Skeleton";
import { MySubmissionItem, TaskListItem, getMyTaskSubmissions, getTasksList } from "@/lib/api";

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [submissions, setSubmissions] = useState<MySubmissionItem[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const [taskRows, submissionRows] = await Promise.all([
          getTasksList(),
          getMyTaskSubmissions().catch(() => []),
        ]);

        if (!active) return;
        setTasks(taskRows);
        setSubmissions(submissionRows);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Unable to load tasks");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h1 className="text-3xl font-black tracking-tight text-white">Company Tasks</h1>
        <p className="mt-2 text-sm text-slate-300">Complete tasks, get scored, and grow your profile ranking.</p>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h2 className="text-xl font-semibold text-white">Active Tasks</h2>
        {loading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard key={idx} className="h-40" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No tasks available"
              message="New company tasks will appear here. Check back soon."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <article key={task.id} className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-amber-300">{task.category}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{task.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-300">{task.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{task.company.name}</span>
                  <span>{formatDate(task.deadline)}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-amber-300">{task.points} points</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h2 className="text-xl font-semibold text-white">My Submissions</h2>
        {loading ? (
          <div className="mt-4">
            <SkeletonTable className="h-56" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No tasks submitted"
              message="Take on your first task to build score and get discovered by companies."
              actionLabel="Browse Tasks"
              actionLink="/tasks"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {submissions.map((item) => (
              <article key={item.id} className="grid gap-2 rounded-lg border border-slate-700 bg-slate-800/70 p-3 sm:grid-cols-[1.8fr_0.8fr_0.8fr_0.8fr] sm:items-center">
                <p className="font-semibold text-white">{item.task.title}</p>
                <p className="text-sm text-slate-300">{item.status}</p>
                <p className="text-sm text-slate-300">Score: {item.score ?? "-"}</p>
                <p className="text-xs text-slate-400">{new Date(item.submitted_at).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
