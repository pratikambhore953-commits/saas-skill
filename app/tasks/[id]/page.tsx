"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  getTaskByIdApi,
  submitTaskApi,
  type TaskDetailResponse,
  type TaskSubmission,
} from "@/lib/api";

function formatRemainingCountdown(remainingMs: number | null): string {
  if (remainingMs === null) return "No deadline";
  if (remainingMs <= 0) return "Deadline passed";

  const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days} days ${hours} hours remaining`;
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-300";
  if (score >= 80) return "text-emerald-300";
  if (score >= 60) return "text-amber-300";
  return "text-rose-300";
}

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [detail, setDetail] = useState<TaskDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getTaskByIdApi(params.id);
        setDetail(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load task");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      void loadDetail();
    }
  }, [params.id]);

  const currentSubmission = useMemo<TaskSubmission | null>(() => {
    if (!detail) return null;
    return detail.current_submission;
  }, [detail]);

  const isPending = currentSubmission?.status === "PENDING" || currentSubmission?.status === "REVIEWED";
  const isScored = currentSubmission?.score !== null && currentSubmission?.score !== undefined;
  const isAccepted = currentSubmission?.status === "ACCEPTED";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!detail) return;

    if (!isAuthenticated) {
      setError("Please log in to submit your solution.");
      return;
    }

    if (content.trim().length < 100) {
      setError("Submission must be at least 100 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submission = await submitTaskApi({
        taskId: detail.task.id,
        content: content.trim(),
        file_url: fileUrl.trim() || undefined,
      });

      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          has_submitted: true,
          current_submission: submission,
        };
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit task");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="h-96 animate-pulse rounded-2xl border border-slate-700 bg-slate-800/70" />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-rose-700/60 bg-rose-900/20 p-4 text-rose-200">{error}</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-6 text-slate-300">Task not found.</div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#0C1222]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(245,158,11,0.16),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(148,163,184,0.15),transparent_40%)]" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 lg:grid-cols-5">
        <section className="space-y-5 lg:col-span-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300">
                {detail.task.company.logo_url ? (
                  <img
                    src={detail.task.company.logo_url}
                    alt={detail.task.company.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  detail.task.company.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-semibold text-white">{detail.task.company.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span>{detail.task.company.industry ?? "Industry N/A"}</span>
                  {detail.task.company.website ? (
                    <>
                      <span>-</span>
                      <a
                        href={detail.task.company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-300 hover:text-amber-200"
                      >
                        Visit website
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
            <h1 className="text-3xl font-semibold text-white">{detail.task.title}</h1>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-slate-200">
                {detail.task.difficulty}
              </span>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-amber-300">
                {detail.task.category}
              </span>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/25 px-2.5 py-1 font-semibold text-amber-200">
                {detail.task.points} XP
              </span>
            </div>

            <p className={`mt-4 text-sm ${detail.task.is_urgent ? "text-rose-300" : "text-slate-300"}`}>
              {formatRemainingCountdown(detail.task.remaining_ms)}
            </p>

            <p className="mt-5 text-slate-200">{detail.task.description}</p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">Requirements</h2>
            <ol className="mt-4 space-y-3">
              {detail.task.requirements.map((item, index) => (
                <li key={item} className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-300">
                    {index + 1}
                  </span>
                  <span className="text-slate-200">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <aside className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-slate-700 bg-slate-900/85 p-5">
            {!currentSubmission && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Submit Your Solution</h2>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Describe your solution..."
                  className="h-44 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent focus:ring-amber-500/40"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Minimum 100 characters</span>
                  <span>{content.length} chars</span>
                </div>

                <input
                  value={fileUrl}
                  onChange={(event) => setFileUrl(event.target.value)}
                  placeholder="Link to your work (optional)"
                  className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent focus:ring-amber-500/40"
                />

                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                  Earn {detail.task.points} points
                </div>

                {!isAuthenticated && (
                  <p className="text-sm text-rose-200">
                    You must be logged in. <Link href="/login" className="text-amber-300">Go to login</Link>
                  </p>
                )}

                {error && <p className="text-sm text-rose-200">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || content.trim().length < 100 || !isAuthenticated}
                  className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Solution"}
                </button>

                <p className="text-xs text-slate-400">AI will score your submission automatically</p>
              </form>
            )}

            {currentSubmission && isPending && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-white">Submission received!</h2>
                <div className="flex items-center gap-2 text-amber-300">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
                  <span>AI is reviewing...</span>
                </div>
              </div>
            )}

            {currentSubmission && isScored && (
              <div className="space-y-4">
                {isAccepted && (
                  <motion.div
                    className="pointer-events-none relative h-12 overflow-hidden rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {Array.from({ length: 12 }).map((_, index) => (
                      <motion.span
                        key={index}
                        className="absolute h-2 w-2 rounded-full"
                        style={{
                          left: `${(index + 1) * 8}%`,
                          backgroundColor: index % 2 === 0 ? "#f59e0b" : "#34d399",
                        }}
                        initial={{ y: -10, opacity: 1 }}
                        animate={{ y: 50, opacity: 0 }}
                        transition={{ duration: 1 + index * 0.03, repeat: Infinity, repeatDelay: 1.2 }}
                      />
                    ))}
                  </motion.div>
                )}

                <p className="text-sm text-slate-300">Your score</p>
                <p className={`text-5xl font-bold ${scoreColor(currentSubmission.score)}`}>{currentSubmission.score}</p>

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    currentSubmission.status === "ACCEPTED"
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                      : "border-rose-500/40 bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {currentSubmission.status}
                </span>

                <p className="text-sm text-slate-200">
                  {currentSubmission.feedback_details?.feedback ?? currentSubmission.feedback ?? "No feedback"}
                </p>

                <div>
                  <h3 className="text-sm font-semibold text-emerald-300">Strengths</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-200">
                    {(currentSubmission.feedback_details?.strengths ?? []).map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-amber-300">Improvements</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-200">
                    {(currentSubmission.feedback_details?.improvements ?? []).map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>

                {isAccepted && (
                  <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 p-3 text-sm text-emerald-200">
                    Congratulations! +{detail.task.points} points earned.
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
