import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  size?: "sm" | "md";
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  size = "md",
}: EmptyStateProps) {
  const padding = size === "sm" ? "py-8 px-4" : "py-12 px-6";
  return (
    <div
      className={`bg-(--color-surface) border border-(--color-border) rounded-lg ${padding} flex flex-col items-center text-center`}
    >
      {icon ? (
        <div className="text-(--color-text-subtle) mb-3" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-(--color-text)">{title}</p>
      {description ? (
        <p className="text-xs text-(--color-text-muted) mt-1 max-w-prose">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
