"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type AvatarUploadProps = {
  editable?: boolean;
};

export default function AvatarUpload({ editable = true }: AvatarUploadProps) {
  const { user, uploadAvatar } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const avatarSrc = preview ?? user?.avatar_url ?? null;
  const initials = useMemo(() => getInitials(user?.name ?? "SS"), [user?.name]);

  const onPickFile = () => {
    if (!editable || loading) return;
    inputRef.current?.click();
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only jpg, png, and webp files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setLoading(true);

    try {
      await uploadAvatar(file);
      setMessage("Avatar updated successfully.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload avatar.");
      setPreview(null);
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      URL.revokeObjectURL(objectUrl);
    }
  };

  const content = (
    <div
      className={`group relative h-24 w-24 overflow-hidden rounded-full border border-slate-600 ${
        editable ? "cursor-pointer" : ""
      }`}
      onClick={onPickFile}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : -1}
      onKeyDown={(event) => {
        if (!editable) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPickFile();
        }
      }}
      aria-label={editable ? "Upload avatar" : "User avatar"}
    >
      {avatarSrc ? (
        <Image src={avatarSrc} alt="User avatar" fill unoptimized loading="lazy" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-amber-500/20 text-xl font-semibold text-amber-300">
          {initials}
        </div>
      )}

      {editable && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
          <div className="rounded-full bg-amber-500 p-2 text-white opacity-0 transition group-hover:opacity-100">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M9 3 7.17 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9Zm3 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      {editable ? content : <Link href="/profile/edit">{content}</Link>}

      {loading && <p className="text-xs text-slate-400">Uploading avatar...</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
      {message && <p className="text-xs text-emerald-300">{message}</p>}

      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
      )}
    </div>
  );
}
