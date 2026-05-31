export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

export function AdminPageSkeleton({ title = "Loading workspace..." }: { title?: string }) {
  return (
    <div className="space-y-8">
      <div>
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
      </div>
      <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-6">
        <p className="mb-4 text-sm text-white/60">{title}</p>
        <div className="space-y-3">
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
        </div>
      </div>
    </div>
  );
}
