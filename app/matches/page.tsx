"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BookSessionModal from "@/components/BookSessionModal";
import { DashboardMatch, PublicUserSkill, getMatches, getPublicUserProfile } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<DashboardMatch[]>([]);
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingTarget, setBookingTarget] = useState<{ id: string; name: string; skills: PublicUserSkill[] } | null>(null);

  useEffect(() => {
    getMatches().then(setMatches);
  }, []);

  const handleMessage = async (otherUserId: string) => {
    const token = localStorage.getItem("skillswap_access_token") ?? localStorage.getItem("skillswap_token");
    if (!token) {
      router.push("/login?next=/matches");
      return;
    }

    try {
      setLoadingMatchId(otherUserId);
      setError(null);
      const response = await fetch(`${API_BASE}/api/chat/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otherUserId }),
      });

      if (!response.ok) {
        throw new Error("Unable to start conversation");
      }

      const body = (await response.json()) as { data: { conversation: { id: string } } };
      router.push(`/chat?conversation=${body.data.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start conversation");
    } finally {
      setLoadingMatchId(null);
    }
  };

  const openBooking = async (match: DashboardMatch) => {
    try {
      setLoadingBookId(match.id);
      setError(null);
      const profile = await getPublicUserProfile(match.id);
      const offeredSkills = profile.skills.filter((skill) => skill.is_offering);
      if (offeredSkills.length === 0) {
        throw new Error("This match has no offered skills available for booking");
      }
      setBookingTarget({ id: profile.id, name: profile.name, skills: offeredSkills });
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Unable to open booking");
    } finally {
      setLoadingBookId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Your Skill Matches</h1>
      <p className="mt-2 text-slate-300">
        People who want what you offer and offer what you want
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-700 bg-[#1E293B] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/20 font-semibold text-amber-400">
                {item.avatar}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{item.name}</h2>
                <p className="text-sm text-slate-400">{item.location}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-300">
              They offer: <span className="font-medium text-white">{item.theyOffer}</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">
              You can teach them: <span className="font-medium text-white">{item.youTeach}</span>
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleMessage(item.id)}
                disabled={loadingMatchId === item.id}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-70"
              >
                {loadingMatchId === item.id ? "Opening..." : "Message"}
              </button>
              <button
                onClick={() => openBooking(item)}
                disabled={loadingBookId === item.id}
                className="rounded-lg border border-amber-500/60 bg-slate-900 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-slate-800 disabled:opacity-70"
              >
                {loadingBookId === item.id ? "Loading..." : "Book Session"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      {bookingTarget && (
        <BookSessionModal
          isOpen={Boolean(bookingTarget)}
          onClose={() => setBookingTarget(null)}
          teacherId={bookingTarget.id}
          teacherName={bookingTarget.name}
          skills={bookingTarget.skills}
        />
      )}
    </div>
  );
}
