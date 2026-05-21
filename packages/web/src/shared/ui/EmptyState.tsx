import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="py-10 flex flex-col items-start gap-2 text-(--color-text)">
      {icon ? (
        <div className="text-(--color-text-subtle)" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <p className="text-sm text-(--color-text)">{title}</p>
      {description ? (
        <p className="text-xs text-(--color-text-muted) max-w-prose">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
