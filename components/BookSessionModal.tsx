"use client";

import { FormEvent, useMemo, useState } from "react";
import { CreateSessionPayload, PublicUserSkill, SessionMode, createSession } from "@/lib/api";

type BookSessionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  skills: PublicUserSkill[];
  onSessionCreated?: () => void;
};

const durations = [30, 60, 90, 120] as const;

function todayIsoDate(): string {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function BookSessionModal({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  skills,
  onSessionCreated,
}: BookSessionModalProps) {
  const offeredSkills = useMemo(() => skills.filter((skill) => skill.is_offering), [skills]);

  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState<number>(60);
  const [mode, setMode] = useState<SessionMode>("ONLINE");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const resetState = () => {
    setSelectedSkillId("");
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setDuration(60);
    setMode("ONLINE");
    setMeetingLink("");
    setLocation("");
    setError(null);
    setSuccess(null);
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (offeredSkills.length === 0) {
      setError("This user has no offered skills available for booking.");
      return;
    }

    if (!selectedSkillId) {
      setError("Please select a skill.");
      return;
    }

    if (!date || !time) {
      setError("Please select date and time.");
      return;
    }

    const sessionDate = new Date(`${date}T${time}`);
    if (Number.isNaN(sessionDate.getTime())) {
      setError("Please provide a valid date and time.");
      return;
    }

    const payload: CreateSessionPayload = {
      teacher_id: teacherId,
      skill_id: selectedSkillId,
      title,
      description: description || undefined,
      date: sessionDate.toISOString(),
      duration_minutes: duration,
      mode,
      meeting_link: mode === "ONLINE" ? meetingLink || undefined : undefined,
      location: mode === "OFFLINE" ? location || undefined : undefined,
    };

    try {
      setLoading(true);
      await createSession(payload);
      setSuccess("Session request sent successfully.");
      onSessionCreated?.();
      setTimeout(() => {
        closeModal();
      }, 900);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to request session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Book a Session</h2>
            <p className="text-sm text-slate-300">Request a learning session with {teacherName}</p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-amber-500 hover:text-amber-300"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Skill</label>
            <select
              value={selectedSkillId}
              onChange={(event) => setSelectedSkillId(event.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              required
            >
              <option value="">Select a skill</option>
              {offeredSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Session title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              placeholder="Example: Intro to React hooks"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Description (optional)</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-24 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              placeholder="What do you want to cover in this session?"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Date</label>
              <input
                type="date"
                min={todayIsoDate()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Time</label>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Duration</label>
              <select
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              >
                {durations.map((value) => (
                  <option key={value} value={value}>
                    {value} min
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Mode</label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-700 bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setMode("ONLINE")}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    mode === "ONLINE"
                      ? "bg-blue-500 text-white"
                      : "bg-transparent text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Online
                </button>
                <button
                  type="button"
                  onClick={() => setMode("OFFLINE")}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    mode === "OFFLINE"
                      ? "bg-amber-500 text-black"
                      : "bg-transparent text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>
          </div>

          {mode === "ONLINE" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Meeting link (optional)</label>
              <input
                type="url"
                value={meetingLink}
                onChange={(event) => setMeetingLink(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="https://meet.google.com/..."
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Location</label>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="Coworking space, cafe, office, etc."
                required
              />
            </div>
          )}

          {error && <p className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}
          {success && (
            <p className="rounded-lg border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Requesting..." : "Request Session"}
          </button>
        </form>
      </div>
    </div>
  );
}
