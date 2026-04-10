"use client";

import AvatarUpload from "@/components/AvatarUpload";
import { useAuth } from "@/context/AuthContext";

export default function ProfileEditPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-slate-300">Please login to edit your profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-slate-700 bg-[#1E293B] p-6">
        <h1 className="text-2xl font-semibold text-white">Edit Profile</h1>
        <p className="mt-1 text-sm text-slate-300">Update your avatar and account details.</p>

        <div className="mt-6">
          <AvatarUpload editable />
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <div className="rounded-lg border border-slate-700 bg-[#121523] px-4 py-3">
            <p className="text-slate-400">Name</p>
            <p className="font-medium text-white">{user.name}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-[#121523] px-4 py-3">
            <p className="text-slate-400">Email</p>
            <p className="font-medium text-white">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
