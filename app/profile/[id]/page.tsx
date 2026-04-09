"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BookSessionModal from "@/components/BookSessionModal";
import { useAuth } from "@/context/AuthContext";
import { PublicUserProfile, getPublicUserProfile } from "@/lib/api";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    getPublicUserProfile(params.id)
      .then((data) => {
        setProfile(data);
        setError(null);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load profile");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-slate-300">Loading profile...</div>;
  }

  if (!profile || error) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-red-300">{error ?? "Profile not found."}</div>;
  }

  const isOwnProfile = user?.id === profile.id;
  const offeredSkills = profile.skills.filter((skill) => skill.is_offering);
  const wantedSkills = profile.skills.filter((skill) => !skill.is_offering);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-sm">
        <p className="text-sm text-slate-400">{profile.location ?? "Location not set"}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">{profile.name}</h1>
        <p className="mt-3 text-slate-300">{profile.bio ?? "No bio provided"}</p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Skills Offered</h2>
            <ul className="mt-3 space-y-2">
              {offeredSkills.length === 0 ? (
                <li className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">No offered skills yet.</li>
              ) : (
                offeredSkills.map((skill) => (
                  <li key={skill.id} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200">
                    {skill.name}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Skills Wanted</h2>
            <ul className="mt-3 space-y-2">
              {wantedSkills.length === 0 ? (
                <li className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">No wanted skills yet.</li>
              ) : (
                wantedSkills.map((skill) => (
                  <li key={skill.id} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200">
                    {skill.name}
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <p className="mt-6 text-sm text-slate-400">Community member since SkillSwap launch</p>

        <div className="mt-6 flex gap-3">
          {!isOwnProfile && offeredSkills.length > 0 && (
            <button
              onClick={() => setBookingOpen(true)}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
            >
              Book a Session
            </button>
          )}
          <Link
            href="/browse"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Back to Browse
          </Link>
        </div>
      </div>

      <BookSessionModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        teacherId={profile.id}
        teacherName={profile.name}
        skills={offeredSkills}
      />
    </div>
  );
}
