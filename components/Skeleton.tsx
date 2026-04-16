import { ReactNode } from "react";

type SkeletonProps = {
  className?: string;
  children?: ReactNode;
};

function baseClass(className?: string): string {
  return `relative overflow-hidden rounded-lg bg-slate-800 ${className ?? ""}`.trim();
}

function shimmer(): ReactNode {
  return <span className="skeleton-shimmer pointer-events-none absolute inset-0" />;
}

export function SkeletonText({ className }: SkeletonProps) {
  return <div className={baseClass(`h-4 ${className ?? ""}`)}>{shimmer()}</div>;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <article className={baseClass(`p-4 ${className ?? ""}`)}>
      {shimmer()}
      <div className="relative z-10 space-y-3">
        <SkeletonText className="w-2/3" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-5/6" />
        <div className="pt-2">
          <SkeletonText className="h-9 w-28" />
        </div>
      </div>
    </article>
  );
}

export function SkeletonProfile({ className }: SkeletonProps) {
  return (
    <section className={baseClass(`p-6 ${className ?? ""}`)}>
      {shimmer()}
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-20 w-20 rounded-full bg-slate-700" />
        <div className="w-full space-y-2">
          <SkeletonText className="h-6 w-48" />
          <SkeletonText className="w-32" />
        </div>
      </div>
      <div className="relative z-10 mt-6 space-y-2">
        <SkeletonText className="w-full" />
        <SkeletonText className="w-11/12" />
        <SkeletonText className="w-3/4" />
      </div>
    </section>
  );
}

export function SkeletonTable({ className }: SkeletonProps) {
  return (
    <section className={baseClass(`p-4 ${className ?? ""}`)}>
      {shimmer()}
      <div className="relative z-10 space-y-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-2 rounded-md bg-slate-900/40 p-2">
            <SkeletonText className="h-3 w-full" />
            <SkeletonText className="h-3 w-full" />
            <SkeletonText className="h-3 w-full" />
            <SkeletonText className="h-3 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
