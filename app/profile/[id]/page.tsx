"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BookSessionModal from "@/components/BookSessionModal";
import { useAuth } from "@/context/AuthContext";
import { PublicUserProfile, getPublicUserProfile } from "@/lib/api";

function formatMemberSince(dateString?: string): string {
  if (!dateString) {
    return "Recently joined";
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Recently joined";
  }
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

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
  const profileAbout = profile.about_me ?? profile.bio ?? "No bio provided";
  const sessionsCompleted = profile.sessions_completed ?? 0;
  const skillsShared = profile.skills_shared ?? offeredSkills.length;
  const memberSince = formatMemberSince(profile.created_at);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-600 bg-slate-800">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={`${profile.name} avatar`} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-amber-300">{profile.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{profile.name}</h1>
            <p className="mt-1 text-sm text-slate-400">{profile.location ?? "Location not set"}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">About Me</h2>
          <p className="mt-2 text-slate-300">{profileAbout}</p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Skills Offered</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {offeredSkills.length === 0 ? (
                <li className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">No offered skills yet.</li>
              ) : (
                offeredSkills.map((skill) => (
                  <li key={skill.id} className="rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-sm text-amber-200">
                    {skill.name}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Skills Wanted</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {wantedSkills.length === 0 ? (
                <li className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">No wanted skills yet.</li>
              ) : (
                wantedSkills.map((skill) => (
                  <li key={skill.id} className="rounded-full border border-blue-500/40 bg-blue-500/20 px-3 py-1.5 text-sm text-blue-200">
                    {skill.name}
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-amber-300">{sessionsCompleted}</p>
            <p className="text-xs text-slate-400">Sessions completed</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-amber-300">{skillsShared}</p>
            <p className="text-xs text-slate-400">Skills shared</p>
          </div>
          <div>
            <p className="text-base font-semibold text-amber-300">{memberSince}</p>
            <p className="text-xs text-slate-400">Member since</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {isOwnProfile ? (
            <Link
              href="/profile/edit"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              Edit Profile
            </Link>
          ) : (
            <>
              {offeredSkills.length > 0 && (
                <button
                  onClick={() => setBookingOpen(true)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
                >
                  Book Session
                </button>
              )}
              <Link
                href={`/chat?userId=${profile.id}`}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Message
              </Link>
            </>
          )}
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
