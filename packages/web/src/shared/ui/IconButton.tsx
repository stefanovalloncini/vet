import type { MouseEventHandler, ReactNode } from "react";

export interface IconButtonProps {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  icon: ReactNode;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function IconButton({
  label,
  onClick,
  icon,
  size = "md",
  disabled = false,
}: IconButtonProps) {
  const sizing =
    size === "sm"
      ? "h-9 w-9 rounded-lg"
      : "h-11 w-11 rounded-xl border border-(--color-border) bg-(--color-surface)";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`${sizing} inline-flex items-center justify-center text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong) hover:bg-(--color-surface-muted) transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 active:scale-[0.97] active:duration-(--motion-press) disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0`}
    >
      {icon}
    </button>
  );
}
