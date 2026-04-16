import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  actionLink?: string;
};

export default function EmptyState({ icon, title, message, actionLabel, actionLink }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">{icon}</div>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">{message}</p>
      {actionLabel && actionLink ? (
        <Link href={actionLink} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
