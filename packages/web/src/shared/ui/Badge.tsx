import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

interface BadgeProps {
  tone?: Tone;
  size?: "sm" | "md";
  children: ReactNode;
}

const toneMap: Record<Tone, string> = {
  neutral:
    "bg-(--color-surface-muted) text-(--color-text-muted) border-(--color-border)",
  accent:
    "bg-(--color-accent-soft) text-(--color-accent) border-(--color-accent)/20",
  success:
    "bg-(--color-success)/10 text-(--color-success) border-(--color-success)/20",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  danger:
    "bg-(--color-danger)/10 text-(--color-danger) border-(--color-danger)/20",
};

export function Badge({ tone = "neutral", size = "sm", children }: BadgeProps) {
  const padding = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border ${padding} ${toneMap[tone]} font-medium`}
    >
      {children}
    </span>
  );
}
