interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-(--color-surface-muted) rounded-md ${className}`}
    />
  );
}

export function CardSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <CardSkeleton rows={2} />
        </li>
      ))}
    </ul>
  );
}
