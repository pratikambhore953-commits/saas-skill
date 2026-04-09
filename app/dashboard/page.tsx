"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  DashboardMatch,
  DashboardStats,
  SkillIntent,
  SkillItem,
  SkillLevel,
  getDashboardStats,
  getInitialUserSkills,
  getRecommendedMatches,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const categories = ["Development", "Design", "Communication", "Analytics", "Business"];
const levels: SkillLevel[] = ["Beginner", "Intermediate", "Advanced"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [matches, setMatches] = useState<DashboardMatch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [level, setLevel] = useState<SkillLevel>("Beginner");
  const [intent, setIntent] = useState<SkillIntent>("offering");
  const [description, setDescription] = useState("");

  useEffect(() => {
    getInitialUserSkills().then(setSkills);
    getRecommendedMatches().then(setMatches);
  }, []);

  useEffect(() => {
    getDashboardStats(skills).then(setStats);
  }, [skills]);

  const offeredSkills = useMemo(() => skills.filter((item) => item.intent === "offering"), [skills]);
  const wantedSkills = useMemo(() => skills.filter((item) => item.intent === "wanting"), [skills]);

  const closeModal = () => {
    setIsModalOpen(false);
    setName("");
    setCategory(categories[0]);
    setLevel("Beginner");
    setIntent("offering");
    setDescription("");
  };

  const handleAddSkill = (event: FormEvent) => {
    event.preventDefault();
    const newSkill: SkillItem = {
      id: `skill-${Date.now()}`,
      name,
      category,
      level,
      intent,
      description,
    };
    setSkills((prev) => [newSkill, ...prev]);
    closeModal();
  };

  const handleDeleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEditSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, level: item.level === "Advanced" ? "Intermediate" : "Advanced" } : item,
      ),
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome back, {user.name}</h1>
          <p className="mt-2 text-slate-300">Manage your profile and discover skill exchanges.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
        >
          Add New Skill
        </button>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Matches" value={stats?.activeMatches ?? 0} />
        <StatCard title="Skills Offered" value={stats?.skillsOffered ?? 0} />
        <StatCard title="Skills Wanted" value={stats?.skillsWanted ?? 0} />
        <StatCard title="Profile Score" value={`${stats?.profileScore ?? 0}%`} />
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <SkillColumn
          title="Skills I Offer"
          items={offeredSkills}
          onEdit={handleEditSkill}
          onDelete={handleDeleteSkill}
        />
        <SkillColumn
          title="Skills I Want to Learn"
          items={wantedSkills}
          onEdit={handleEditSkill}
          onDelete={handleDeleteSkill}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-white">Recommended Matches</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {matches.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-700 bg-[#1E293B] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 font-semibold text-amber-400">
                  {item.avatar}
                </div>
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-slate-400">{item.location}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-300">
                They offer: <span className="font-medium text-white">{item.theyOffer}</span>
              </p>
              <p className="mt-1 text-sm text-slate-300">
                You can teach: <span className="font-medium text-white">{item.youTeach}</span>
              </p>
              <button className="mt-4 w-full rounded-lg border border-amber-500 bg-transparent px-3 py-2 text-sm font-semibold text-amber-400 transition hover:border-amber-400 hover:text-amber-300">
                Connect
              </button>
            </article>
          ))}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#1E293B] p-6">
            <h3 className="text-xl font-semibold text-white">Add New Skill</h3>
            <form onSubmit={handleAddSkill} className="mt-4 space-y-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Skill name"
                className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent focus:ring-amber-500/35"
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value as SkillLevel)}
                  className="rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none"
                >
                  {levels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="radio"
                    name="intent"
                    checked={intent === "offering"}
                    onChange={() => setIntent("offering")}
                  />
                  I Offer
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="radio"
                    name="intent"
                    checked={intent === "wanting"}
                    onChange={() => setIntent("wanting")}
                  />
                  I Want to Learn
                </label>
              </div>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short description"
                className="h-24 w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent focus:ring-amber-500/35"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400"
                >
                  Add Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-amber-400">{value}</p>
    </div>
  );
}

function SkillColumn({
  title,
  items,
  onEdit,
  onDelete,
}: {
  title: string;
  items: SkillItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-700 bg-[#1E293B] p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 && <p className="text-sm text-slate-400">No skills added yet.</p>}
        {items.map((skill) => (
          <article key={skill.id} className="rounded-xl border border-slate-700 bg-[#121523] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-white">{skill.name}</h3>
              <div className="flex gap-2 text-xs">
                <span className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-400">{skill.category}</span>
                <span className="rounded-full bg-slate-700/70 px-2 py-1 text-slate-200">{skill.level}</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-300">{skill.description}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onEdit(skill.id)}
                className="rounded-md border border-slate-600 px-2.5 py-1.5 text-xs font-semibold text-slate-200"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(skill.id)}
                className="rounded-md border border-rose-800 px-2.5 py-1.5 text-xs font-semibold text-rose-300"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
