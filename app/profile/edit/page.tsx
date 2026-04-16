"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import OTPVerifySheet from "@/components/OTPVerifySheet";
import SkillTagInput from "@/components/SkillTagInput";
import { useAuth } from "@/context/AuthContext";
import {
  ProfileChangeType,
  ProfileSkillInput,
  deleteCurrentUser,
  getPublicUserProfile,
  updateProfileBasic,
  updateProfileSkills,
  uploadProfileAvatar,
} from "@/lib/api";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function maskEmail(email: string): string {
  const [username, domain] = email.split("@");
  if (!username || !domain) {
    return email;
  }
  if (username.length <= 2) {
    return `${username[0] ?? ""}***@${domain}`;
  }
  return `${username.slice(0, 2)}***@${domain}`;
}

function mapPublicSkillsToInput(
  skills: Array<{ name: string; is_offering: boolean; category?: string; level?: string; description?: string | null }>,
): ProfileSkillInput[] {
  return skills.map((skill) => ({
    name: skill.name,
    category: (skill.category as ProfileSkillInput["category"]) ?? "OTHER",
    level: (skill.level as ProfileSkillInput["level"]) ?? "BEGINNER",
    is_offering: skill.is_offering,
    description: skill.description ?? undefined,
  }));
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [skills, setSkills] = useState<ProfileSkillInput[]>([]);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [savingBasic, setSavingBasic] = useState(false);
  const [basicStatus, setBasicStatus] = useState<string | null>(null);
  const [basicError, setBasicError] = useState<string | null>(null);

  const [savingSkills, setSavingSkills] = useState(false);
  const [skillsStatus, setSkillsStatus] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  const [securitySheetOpen, setSecuritySheetOpen] = useState(false);
  const [securityType, setSecurityType] = useState<ProfileChangeType>("EMAIL_CHANGE");
  const [securityStatus, setSecurityStatus] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!user) {
        setInitialLoading(false);
        return;
      }
      try {
        setInitialLoading(true);
        const profile = await getPublicUserProfile(user.id);
        if (!mounted) {
          return;
        }
        setName(profile.name ?? user.name);
        setAboutMe(profile.about_me ?? profile.bio ?? user.about_me ?? user.bio ?? "");
        setLocation(profile.location ?? user.location ?? "");
        setPhone((profile as { phone?: string | null }).phone ?? user.phone ?? null);
        setSkills(mapPublicSkillsToInput(profile.skills ?? []));
        setLoadError(null);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setName(user.name);
        setAboutMe(user.about_me ?? user.bio ?? "");
        setLocation(user.location ?? "");
        setPhone(user.phone ?? null);
        setLoadError(error instanceof Error ? error.message : "Unable to load profile");
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  const avatarSrc = avatarPreview ?? user?.avatar_url ?? null;
  const initials = useMemo(() => getInitials(name || user?.name || "SS"), [name, user?.name]);

  const handleAvatarPick = () => {
    try {
      if (avatarUploading) {
        return;
      }
      fileInputRef.current?.click();
    } catch {
      setAvatarError("Unable to open file picker");
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      setAvatarError(null);
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setAvatarError("Only JPG, PNG, and WEBP files are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError("File size must be below 5MB.");
        return;
      }

      const tempPreview = URL.createObjectURL(file);
      setAvatarPreview(tempPreview);
      setAvatarUploading(true);
      const updated = await uploadProfileAvatar(file);
      updateUser({
        name: updated.name,
        email: updated.email,
        phone: (updated as { phone?: string | null }).phone ?? undefined,
        avatar_url: updated.avatar_url,
        bio: updated.bio ?? null,
        about_me: updated.about_me ?? updated.bio ?? null,
        location: updated.location,
        email_verified: (updated as { email_verified?: boolean }).email_verified,
      });
      toast.success("Profile photo updated!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Avatar upload failed";
      setAvatarError(message);
      toast.error(message);
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveBasic = async () => {
    try {
      setBasicError(null);
      setBasicStatus(null);
      if (aboutMe.length > 300) {
        setBasicError("About Me cannot exceed 300 characters.");
        return;
      }
      setSavingBasic(true);
      const updated = await updateProfileBasic({
        name: name.trim(),
        about_me: aboutMe.trim(),
        location: location.trim(),
      });
      updateUser({
        name: updated.name,
        email: updated.email,
        phone: (updated as { phone?: string | null }).phone ?? undefined,
        avatar_url: updated.avatar_url,
        bio: updated.bio ?? null,
        about_me: updated.about_me ?? updated.bio ?? null,
        location: updated.location,
        email_verified: (updated as { email_verified?: boolean }).email_verified,
      });
      setBasicStatus("Saved");
      toast.success("Profile updated!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save profile";
      setBasicError(message);
      toast.error(message);
    } finally {
      setSavingBasic(false);
    }
  };

  const handleSaveSkills = async () => {
    try {
      setSkillsError(null);
      setSkillsStatus(null);
      setSavingSkills(true);
      await updateProfileSkills(skills);
      setSkillsStatus("Skills saved");
      toast.success("Skill added successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save skills";
      setSkillsError(message);
      toast.error(message);
    } finally {
      setSavingSkills(false);
    }
  };

  const openSecuritySheet = (type: ProfileChangeType) => {
    try {
      setSecurityType(type);
      setSecurityStatus(null);
      setSecuritySheetOpen(true);
    } catch {
      setSecurityStatus("Unable to open security verification");
    }
  };

  const handleSecuritySuccess = async () => {
    try {
      if (!user) {
        return;
      }
      const updated = await getPublicUserProfile(user.id);
      updateUser({
        name: updated.name,
        email: updated.email,
        phone: (updated as { phone?: string | null }).phone ?? undefined,
        avatar_url: updated.avatar_url,
        bio: updated.bio ?? null,
        about_me: updated.about_me ?? updated.bio ?? null,
        location: updated.location,
        email_verified: (updated as { email_verified?: boolean }).email_verified,
      });
      setPhone((updated as { phone?: string | null }).phone ?? null);
      setSecurityStatus("Security changes applied");
      toast.success("Security settings updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh profile";
      setSecurityStatus(message);
      toast.error(message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteError(null);
      setDeletingAccount(true);
      await deleteCurrentUser();
      logout();
      toast.success("Account deleted");
      router.push("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete account";
      setDeleteError(message);
      toast.error(message);
    } finally {
      setDeletingAccount(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-slate-300">Please login to edit your profile.</p>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-6">
          <p className="text-slate-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="space-y-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Edit Profile</h1>
          <p className="mt-1 text-sm text-slate-300">Manage your profile, skills, and account security.</p>
          {loadError && <p className="mt-2 text-sm text-rose-300">{loadError}</p>}
        </div>

        <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleAvatarPick}
              className="group relative h-[120px] w-[120px] overflow-hidden rounded-full border border-slate-600"
            >
              {avatarSrc ? (
                <Image src={avatarSrc} alt="Profile avatar" fill unoptimized loading="lazy" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-amber-500 text-3xl font-semibold text-black">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/45">
                {avatarUploading ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <div className="rounded-full bg-black/60 p-2 text-white opacity-0 transition group-hover:opacity-100">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M9 3 7.17 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9Zm3 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="mt-3 text-sm text-slate-300">Click avatar to upload</p>
            {avatarError && <p className="mt-2 text-sm text-rose-300">{avatarError}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white">Basic Info</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-200">Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent focus:ring-amber-500/35"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-200">About Me</label>
              <textarea
                value={aboutMe}
                onChange={(event) => setAboutMe(event.target.value.slice(0, 300))}
                className="h-28 w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent focus:ring-amber-500/35"
              />
              <p className="mt-1 text-right text-xs text-slate-400">{aboutMe.length}/300</p>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-200">Location</label>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent focus:ring-amber-500/35"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveBasic}
                disabled={savingBasic}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingBasic ? "Saving..." : "Save"}
              </button>
              {basicStatus && (
                <p className="inline-flex items-center gap-1 text-sm text-emerald-300">
                  <span>✓</span>
                  {basicStatus}
                </p>
              )}
            </div>
            {basicError && <p className="text-sm text-rose-300">{basicError}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white">Your Skills</h2>
          <p className="mt-1 text-sm text-slate-300">Skills you offer and want to learn</p>
          <div className="mt-4">
            <SkillTagInput skills={skills} onChange={setSkills} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveSkills}
              disabled={savingSkills}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingSkills ? "Saving..." : "Save Skills"}
            </button>
            {skillsStatus && <p className="text-sm text-emerald-300">{skillsStatus}</p>}
          </div>
          {skillsError && <p className="mt-2 text-sm text-rose-300">{skillsError}</p>}
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white">Account Security</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-[#121523] px-4 py-3">
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-sm font-medium text-white">{maskEmail(user.email)}</p>
              </div>
              <button
                type="button"
                onClick={() => openSecuritySheet("EMAIL_CHANGE")}
                className="rounded-lg border border-amber-500/50 px-3 py-1.5 text-sm font-semibold text-amber-300 hover:border-amber-400"
              >
                Change
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-[#121523] px-4 py-3">
              <div>
                <p className="text-sm text-slate-400">Phone</p>
                <p className="text-sm font-medium text-white">{phone ?? "Not added"}</p>
              </div>
              <button
                type="button"
                onClick={() => openSecuritySheet("PHONE_CHANGE")}
                className="rounded-lg border border-amber-500/50 px-3 py-1.5 text-sm font-semibold text-amber-300 hover:border-amber-400"
              >
                {phone ? "Change" : "Add"}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-[#121523] px-4 py-3">
              <div>
                <p className="text-sm text-slate-400">Password</p>
                <p className="text-sm font-medium text-white">••••••••</p>
              </div>
              <button
                type="button"
                onClick={() => openSecuritySheet("PASSWORD_CHANGE")}
                className="rounded-lg border border-amber-500/50 px-3 py-1.5 text-sm font-semibold text-amber-300 hover:border-amber-400"
              >
                Change
              </button>
            </div>
          </div>
          {securityStatus && <p className="mt-3 text-sm text-emerald-300">{securityStatus}</p>}
        </section>

        <section className="rounded-xl border border-rose-800/40 bg-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
          <p className="mt-1 text-sm text-slate-300">Delete your account permanently.</p>
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="mt-4 rounded-lg border border-rose-500 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
          >
            Delete Account
          </button>
          {deleteError && <p className="mt-2 text-sm text-rose-300">{deleteError}</p>}
        </section>
      </div>

      <OTPVerifySheet
        isOpen={securitySheetOpen}
        onClose={() => setSecuritySheetOpen(false)}
        onSuccess={() => {
          void handleSecuritySuccess();
        }}
        changeType={securityType}
        title={
          securityType === "EMAIL_CHANGE"
            ? "Change Email Address"
            : securityType === "PHONE_CHANGE"
              ? "Verify Phone Number"
              : "Change Password"
        }
        description={
          securityType === "EMAIL_CHANGE"
            ? "Enter your new email. We will send a verification code to confirm."
            : securityType === "PHONE_CHANGE"
              ? "Enter your phone number. We will send a verification code."
              : "We will send a verification code to your email first."
        }
        extraField={
          securityType === "EMAIL_CHANGE"
            ? { label: "New Email", name: "new_email", type: "email" }
            : securityType === "PHONE_CHANGE"
              ? { label: "Phone Number", name: "phone", type: "tel" }
              : { label: "New Password", name: "new_password", type: "password" }
        }
      />

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-5">
            <h3 className="text-lg font-semibold text-white">Confirm account deletion</h3>
            <p className="mt-2 text-sm text-slate-300">
              This action is permanent and cannot be undone. Are you sure you want to continue?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDeleteAccount();
                }}
                disabled={deletingAccount}
                className="rounded-lg border border-rose-500 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingAccount ? "Deleting..." : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
