"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProfileSkillInput, SkillCategory, SkillProficiency } from "@/lib/api";

type SkillTagInputProps = {
  skills: ProfileSkillInput[];
  onChange: (skills: ProfileSkillInput[]) => void;
};

const categories: SkillCategory[] = ["TECHNOLOGY", "DESIGN", "LANGUAGE", "MUSIC", "BUSINESS", "OTHER"];
const levels: SkillProficiency[] = ["BEGINNER", "INTERMEDIATE", "EXPERT"];

type DraftSkill = {
  name: string;
  category: SkillCategory;
  level: SkillProficiency;
  is_offering: boolean;
  description: string;
};

function defaultDraft(): DraftSkill {
  return {
    name: "",
    category: "TECHNOLOGY",
    level: "BEGINNER",
    is_offering: true,
    description: "",
  };
}

export default function SkillTagInput({ skills, onChange }: SkillTagInputProps) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DraftSkill>(defaultDraft());
  const [error, setError] = useState<string | null>(null);

  const canAdd = skills.length < 20;
  const remaining = useMemo(() => Math.max(0, 20 - skills.length), [skills.length]);

  const handleAdd = () => {
    setError(null);
    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      setError("Skill name is required.");
      return;
    }
    if (!canAdd) {
      setError("You can add up to 20 skills.");
      return;
    }

    const nextSkill: ProfileSkillInput = {
      name: trimmedName,
      category: draft.category,
      level: draft.level,
      is_offering: draft.is_offering,
      description: draft.description.trim() || undefined,
    };

    onChange([...skills, nextSkill]);
    setDraft(defaultDraft());
    setShowForm(false);
  };

  const handleRemove = (index: number) => {
    onChange(skills.filter((_, skillIndex) => skillIndex !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {skills.map((skill, index) => {
            const offering = skill.is_offering;
            return (
              <motion.div
                key={`${skill.name}-${skill.category}-${skill.level}-${index}`}
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -8 }}
                transition={{ duration: 0.2 }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                  offering
                    ? "border-amber-500/40 bg-amber-500/20 text-amber-200"
                    : "border-blue-500/40 bg-blue-500/20 text-blue-200"
                }`}
              >
                <span className="font-medium">{skill.name}</span>
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">{skill.level}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-xs font-semibold transition hover:text-white"
                  aria-label={`Remove ${skill.name}`}
                >
                  X
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <p className="text-xs text-slate-400">{remaining} skill slots remaining</p>

      {!showForm ? (
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => setShowForm(true)}
          className="rounded-lg border border-amber-500/50 px-3 py-2 text-sm font-semibold text-amber-300 transition hover:border-amber-400 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add Skill
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <div>
            <label className="mb-1 block text-sm text-slate-200">Skill Name</label>
            <input
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent focus:ring-amber-500/35"
              placeholder="e.g. React"
              maxLength={40}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-200">Category</label>
              <select
                value={draft.category}
                onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value as SkillCategory }))}
                className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-200">Level</label>
              <select
                value={draft.level}
                onChange={(event) => setDraft((prev) => ({ ...prev, level: event.target.value as SkillProficiency }))}
                className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-200">Skill Type</label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-700 bg-[#121523] p-1">
              <button
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, is_offering: true }))}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  draft.is_offering ? "bg-amber-500 text-black" : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                Offering
              </button>
              <button
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, is_offering: false }))}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  !draft.is_offering ? "bg-blue-500 text-white" : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                Wanting
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-200">Description (optional)</label>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              className="h-20 w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent focus:ring-amber-500/35"
              maxLength={120}
            />
          </div>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
                setDraft(defaultDraft());
              }}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
