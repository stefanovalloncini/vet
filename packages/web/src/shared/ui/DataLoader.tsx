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
        className="bg-(--color-surface) border border-(--color-danger)/30 rounded-lg p-6 text-sm"
      >
        <p className="font-medium text-(--color-danger) mb-2">
          Caricamento non riuscito
        </p>
        <p className="text-(--color-text-muted) mb-3">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="text-(--color-accent) hover:underline text-sm"
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
