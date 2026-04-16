"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import ScoreRing from "@/components/ScoreRing";
import { analyseMyProfile, getSkillAnalysis, type SkillAnalysis } from "@/lib/api";

const loadingMessages = [
  "Analysing your skills...",
  "Identifying skill gaps...",
  "Finding career paths...",
  "Generating recommendations...",
  "Almost done...",
];

function formatLastAnalysed(dateValue: string): string {
  const analysedDate = new Date(dateValue);
  const now = new Date();
  const diffMs = now.getTime() - analysedDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export default function AnalysisPage() {
  const { data: session, status } = useSession();
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(0);

  useEffect(() => {
    console.log("[AnalysisPage] session state", {
      status,
      hasSession: Boolean(session),
      hasAccessToken: Boolean(session?.accessToken),
      userId: session?.user?.id,
    });
  }, [session, status]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    async function fetchExistingAnalysis() {
      try {
        setIsLoading(true);
        if (!session?.accessToken) {
          console.log("[AnalysisPage] missing access token in session");
          throw new Error("No NextAuth access token found in session. Please sign in again.");
        }

        console.log("[AnalysisPage] fetching analysis with session token", {
          userId: session.user?.id,
          hasAccessToken: Boolean(session.accessToken),
        });

        const result = await getSkillAnalysis(session.accessToken);
        setAnalysis(result);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to fetch analysis";
        if (!message.includes("No analysis yet")) {
          setError(message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void fetchExistingAnalysis();
  }, [session?.accessToken, session?.user?.id, status]);

  const lastAnalysedLabel = useMemo(() => {
    if (!analysis) return "";
    return formatLastAnalysed(analysis.last_analysed_at);
  }, [analysis]);

  const handleAnalyse = async () => {
    try {
      setError("");
      setIsAnalysing(true);

      if (!session) {
        throw new Error("Please sign in to analyse your profile.");
      }

      const result = await analyseMyProfile(session.accessToken);
      setAnalysis(result);
      toast.success("Analysis complete!");
    } catch (analyseError) {
      const message = analyseError instanceof Error ? analyseError.message : "Something went wrong. Try again.";
      setError(message);
      toast.error(message);
      console.error(analyseError);
    } finally {
      setIsAnalysing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center px-4 py-10">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-300/30 border-t-amber-400" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mx-auto min-h-[80vh] w-full max-w-6xl px-4 py-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-amber-500/25 bg-slate-900/80 p-10 text-center shadow-[0_0_0_1px_rgba(245,158,11,0.12),0_25px_70px_-40px_rgba(245,158,11,0.75)]">
          <div className="mb-5 text-amber-300">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3a9 9 0 1 0 9 9" />
              <path d="M13.5 2.5 16 8l5.5 2.5L16 13l-2.5 5.5L11 13l-5.5-2.5L11 8l2.5-5.5Z" />
            </svg>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Discover Your Skill DNA</h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">
            Our AI analyses your profile and gives you a personalised roadmap to accelerate your growth.
          </p>
          <button
            type="button"
            onClick={handleAnalyse}
            disabled={isAnalysing}
            className="mt-8 rounded-xl bg-amber-500 px-8 py-3 text-lg font-semibold text-black transition hover:bg-amber-400 disabled:opacity-70"
          >
            {isAnalysing ? "Analysing..." : "Analyse My Profile"}
          </button>
          <p className="mt-3 text-sm text-slate-400">Takes about 10 seconds</p>

          {isAnalysing && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-300/25 border-t-amber-400" />
              <p className="text-sm text-amber-200">{loadingMessages[loadingIndex]}</p>
            </div>
          )}

          {error ? <p className="mt-6 text-sm text-red-300">{error}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-white">AI Skill Analysis</h1>
            <button
              type="button"
              onClick={handleAnalyse}
              disabled={isAnalysing}
              className="rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-70"
            >
              {isAnalysing ? "Re-analysing..." : "Re-analyse"}
            </button>
          </div>
          <div className="mt-6 flex flex-col items-center gap-4">
            <ScoreRing score={analysis.profile_score} size={220} animated />
            <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Profile Strength</p>
            <p className="max-w-2xl text-center text-slate-300">{analysis.score_explanation ?? analysis.summary}</p>
            <p className="text-xs text-slate-500">Last analysed: {lastAnalysedLabel}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-500/30 bg-slate-800/85 p-6">
          <h2 className="text-xl font-semibold text-amber-300">Summary</h2>
          <p className="mt-3 border-l-4 border-amber-400 pl-4 text-slate-200">{analysis.summary}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/25 bg-slate-800/85 p-6">
            <h3 className="text-lg font-semibold text-emerald-300">Your Strengths</h3>
            <ul className="mt-4 space-y-3">
              {analysis.strengths.map((strength) => (
                <li key={strength} className="flex items-start gap-2 text-slate-200">
                  <span className="mt-0.5 text-emerald-300">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-slate-800/85 p-6">
            <h3 className="text-lg font-semibold text-amber-300">Areas to Improve</h3>
            <ul className="mt-4 space-y-3">
              {analysis.weaknesses.map((weakness) => (
                <li key={weakness} className="flex items-start gap-2 text-slate-200">
                  <span className="mt-0.5 text-amber-300">⚠</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold text-white">Skills You Should Add</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {analysis.skill_gaps.map((skill) => (
              <motion.article
                key={skill}
                whileHover={{ y: -4 }}
                className="min-w-[260px] rounded-xl border border-amber-500/30 bg-slate-800/85 p-4"
              >
                <h3 className="text-lg font-semibold text-white">{skill}</h3>
                <p className="mt-1 text-xs text-slate-400">Missing from your profile</p>
                <Link
                  href="/profile/edit"
                  className="mt-4 inline-block rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black"
                >
                  Add This Skill
                </Link>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/85 p-6">
          <h2 className="text-2xl font-semibold text-white">Your Personal Action Plan</h2>
          <div className="mt-4 space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <motion.div
                key={recommendation}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-start gap-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-black">
                  {index + 1}
                </span>
                <p className="text-slate-200">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold text-white">Where Your Skills Can Take You</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {analysis.career_paths.map((path) => (
              <article
                key={path}
                className="rounded-xl border border-amber-500/35 bg-gradient-to-b from-slate-800 to-slate-900 p-4"
              >
                <div className="mb-3 text-amber-300">💼</div>
                <h3 className="text-lg font-semibold text-white">{path}</h3>
                <button className="mt-4 rounded-md border border-amber-400 px-3 py-1.5 text-sm text-amber-200">Explore</button>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/85 p-6">
          <h2 className="text-2xl font-semibold text-white">Recommended Learning Resources</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {analysis.learning_resources.map((resource, index) => (
              <article key={`${resource.skill}-${resource.resource}-${index}`} className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{resource.skill}</p>
                <p className="mt-1 text-sm font-semibold text-white">{resource.resource}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      resource.type === "free" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {resource.type === "free" ? "Free" : "Paid"}
                  </span>
                  {resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-200"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">No link available</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/85 p-6">
          <h2 className="text-2xl font-semibold text-white">Get Better Skill Matches</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {analysis.match_improvement_tips.map((tip) => (
              <article key={tip} className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                <p className="text-amber-300">💡</p>
                <p className="mt-2 text-sm text-slate-200">{tip}</p>
              </article>
            ))}
          </div>
        </section>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>
    </div>
  );
}
