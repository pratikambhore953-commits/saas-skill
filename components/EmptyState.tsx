import Link from "next/link";
import { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  actionLink?: string;
};

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  actionLink,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
        {icon ?? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 9h12M6 13h8M6 17h6M4 4h16v16H4z" />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">{message}</p>
      {actionLabel && actionLink && (
        <Link
          href={actionLink}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-black transition hover:bg-amber-400"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
