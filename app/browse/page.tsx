"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { BrowseSkill, getBrowseSkills } from "@/lib/api";

const categories = ["All", "Development", "Design", "Communication", "Analytics", "Business"];
const levels = ["All", "Beginner", "Intermediate", "Advanced"];
const SKELETON_ITEMS = 6;

export default function BrowsePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const [intent, setIntent] = useState<"all" | "offering" | "wanting">("all");
  const [skills, setSkills] = useState<BrowseSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const beginFetch = () => {
    setLoading(true);
    setError("");
  };

  useEffect(() => {
    let active = true;

    getBrowseSkills({ search, category, level, intent })
      .then((result) => {
        if (!active) return;
        setSkills(result);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load skills right now.");
        setSkills([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, category, level, intent]);

  const resultLabel = useMemo(() => {
    if (loading) return "Loading skills...";
    return `${skills.length} skill${skills.length === 1 ? "" : "s"} found`;
  }, [loading, skills.length]);

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_15%,rgba(245,158,11,0.16),transparent_40%),radial-gradient(circle_at_88%_10%,rgba(99,102,241,0.18),transparent_36%)]" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Discover Skills</h1>
          <p className="mt-2 max-w-2xl text-slate-300">Find people offering what you need and people looking for what you can teach.</p>
        </motion.div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-[#0b1224]/80 p-4 backdrop-blur sm:p-5">
          <input
            value={search}
            onChange={(event) => {
              beginFetch();
              setSearch(event.target.value);
            }}
            placeholder="Search by skill, description, or person"
            className="w-full rounded-xl border border-white/15 bg-[#121523] px-3.5 py-2.5 text-white outline-none ring-2 ring-transparent transition focus:border-amber-400/45 focus:ring-amber-500/25"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={category}
              onChange={(event) => {
                beginFetch();
                setCategory(event.target.value);
              }}
              className="rounded-xl border border-white/15 bg-[#121523] px-3 py-2.5 text-white outline-none"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={level}
              onChange={(event) => {
                beginFetch();
                setLevel(event.target.value);
              }}
              className="rounded-xl border border-white/15 bg-[#121523] px-3 py-2.5 text-white outline-none"
            >
              {levels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="col-span-2 grid grid-cols-3 rounded-xl border border-white/15 bg-[#121523] p-1">
              <ToggleButton
                label="All"
                active={intent === "all"}
                onClick={() => {
                  beginFetch();
                  setIntent("all");
                }}
              />
              <ToggleButton
                label="Offering"
                active={intent === "offering"}
                onClick={() => {
                  beginFetch();
                  setIntent("offering");
                }}
              />
              <ToggleButton
                label="Wanting"
                active={intent === "wanting"}
                onClick={() => {
                  beginFetch();
                  setIntent("wanting");
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
          <p>{resultLabel}</p>
          {(search || category !== "All" || level !== "All" || intent !== "all") && (
            <button
              type="button"
              onClick={() => {
                beginFetch();
                setSearch("");
                setCategory("All");
                setLevel("All");
                setIntent("all");
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: SKELETON_ITEMS }).map((_, index) => <SkillCardSkeleton key={`skeleton-${index}`} />)
            : skills.map((skill) => (
                <motion.article
                  key={skill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group rounded-2xl border border-white/10 bg-[#121a2f] p-5 transition hover:-translate-y-0.5 hover:border-amber-400/45 hover:shadow-lg hover:shadow-black/25"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-300">{skill.category}</span>
                    <span className="rounded-full bg-slate-700 px-2 py-1 text-slate-200">{skill.level}</span>
                    <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-indigo-200">
                      {skill.intent === "offering" ? "Offering" : "Wanting"}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-semibold text-white">{skill.name}</h2>
                  <p className="mt-2 min-h-10 text-sm text-slate-300">{skill.description}</p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-sm font-semibold text-amber-300">
                      {skill.owner.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{skill.owner.name}</p>
                      <p className="text-xs text-slate-400">{skill.owner.location}</p>
                    </div>
                  </div>

                  <Link
                    href={`/profile/${skill.owner.id}`}
                    className="mt-4 inline-flex rounded-lg border border-amber-500/80 bg-transparent px-3 py-2 text-sm font-semibold text-amber-300 transition group-hover:border-amber-300 group-hover:text-amber-200"
                  >
                    View Profile
                  </Link>
                </motion.article>
              ))}
        </div>

        {!loading && !error && skills.length === 0 && (
          <p className="mt-8 rounded-xl border border-white/10 bg-[#121a2f] p-4 text-slate-300">
            No skills matched your filters. Try broadening your search terms.
          </p>
        )}
      </div>
    </div>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
        active ? "bg-amber-500 text-black" : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function SkillCardSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-white/10 bg-[#121a2f] p-5">
      <div className="flex gap-2">
        <span className="h-5 w-20 rounded-full bg-slate-700" />
        <span className="h-5 w-16 rounded-full bg-slate-700" />
      </div>
      <div className="mt-4 h-5 w-2/3 rounded bg-slate-700" />
      <div className="mt-3 h-4 w-full rounded bg-slate-700" />
      <div className="mt-2 h-4 w-5/6 rounded bg-slate-700" />
      <div className="mt-5 flex items-center gap-3">
        <span className="h-10 w-10 rounded-full bg-slate-700" />
        <div className="w-full">
          <div className="h-4 w-24 rounded bg-slate-700" />
          <div className="mt-2 h-3 w-32 rounded bg-slate-700" />
        </div>
      </div>
      <div className="mt-4 h-9 w-28 rounded-lg bg-slate-700" />
    </article>
  );
}
