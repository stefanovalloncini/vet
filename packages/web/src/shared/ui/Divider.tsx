import type { ReactNode } from "react";

interface DividerProps {
  children?: ReactNode;
  className?: string;
}

export function Divider({ children, className = "" }: DividerProps) {
  if (!children) {
    return <hr className={`border-(--color-border) ${className}`} />;
  }
  return (
    <div
      className={`flex items-center gap-3 text-xs text-(--color-text-muted) ${className}`}
    >
      <span className="flex-1 h-px bg-(--color-border)" />
      <span className="uppercase tracking-wider">{children}</span>
      <span className="flex-1 h-px bg-(--color-border)" />
    </div>
  );
}
