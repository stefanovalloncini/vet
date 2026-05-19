import type { ReactNode } from "react";
import { ListSkeleton } from "./Skeleton";

interface DataLoaderProps {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  skeleton?: ReactNode;
  emptyState?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

export function DataLoader({
  loading,
  error,
  empty,
  skeleton,
  emptyState,
  onRetry,
  children,
}: DataLoaderProps) {
  if (loading) return <>{skeleton ?? <ListSkeleton count={3} />}</>;
  if (error) {
    return (
      <div
        role="alert"
        className="bg-(--color-surface) border border-(--color-danger)/30 rounded-2xl p-6"
      >
        <p className="text-sm font-medium text-(--color-danger) mb-1.5">
          Caricamento non riuscito
        </p>
        <p className="text-xs text-(--color-text-muted) mb-4 break-words">
          {error}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-medium text-(--color-accent) hover:underline"
          >
            Riprova
          </button>
        ) : null}
      </div>
    );
  }
  if (empty) return <>{emptyState}</>;
  return <>{children}</>;
}
