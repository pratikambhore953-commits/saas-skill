export function SkeletonText({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-700/70 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
      <SkeletonText className="h-5 w-2/3" />
      <SkeletonText className="mt-3 h-4 w-full" />
      <SkeletonText className="mt-2 h-4 w-5/6" />
      <SkeletonText className="mt-5 h-10 w-28" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-slate-700/70" />
        <div className="flex-1 space-y-2">
          <SkeletonText className="h-5 w-40" />
          <SkeletonText className="h-4 w-2/3" />
        </div>
      </div>
      <SkeletonText className="mt-5 h-4 w-full" />
      <SkeletonText className="mt-2 h-4 w-4/5" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60">
      <div className="grid grid-cols-3 gap-3 border-b border-slate-700 p-4">
        <SkeletonText className="h-4 w-20" />
        <SkeletonText className="h-4 w-20" />
        <SkeletonText className="h-4 w-20" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`row-${index}`} className="grid grid-cols-3 gap-3 border-b border-slate-800 p-4 last:border-b-0">
          <SkeletonText className="h-4 w-24" />
          <SkeletonText className="h-4 w-28" />
          <SkeletonText className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
