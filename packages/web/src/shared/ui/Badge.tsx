import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

interface BadgeProps {
  tone?: Tone;
  size?: "sm" | "md";
  dot?: boolean;
  children?: ReactNode;
  "aria-label"?: string;
}

const toneMap: Record<Tone, string> = {
  neutral:
    "bg-(--color-surface-muted) text-(--color-text-muted) border-(--color-border)",
  accent:
    "bg-(--color-accent-soft) text-(--color-accent) border-(--color-accent)/20",
  success:
    "bg-(--color-success)/10 text-(--color-success) border-(--color-success)/20",
  warning:
    "bg-(--color-warning)/15 text-(--color-warning) border-(--color-warning)/30",
  danger:
    "bg-(--color-danger)/10 text-(--color-danger) border-(--color-danger)/20",
};

const dotMap: Record<Tone, string> = {
  neutral: "bg-(--color-text-subtle)",
  accent: "bg-(--color-accent)",
  success: "bg-(--color-success)",
  warning: "bg-(--color-warning)",
  danger: "bg-(--color-danger)",
};

export function Badge({ tone = "neutral", size: _size, dot, children, ...rest }: BadgeProps) {
  if (dot && !children) {
    return (
      <span
        className={`inline-block h-2 w-2 rounded-full ${dotMap[tone]}`}
        role={rest["aria-label"] ? "img" : undefined}
        {...rest}
      />
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full h-5 px-2 text-[12px] border ${toneMap[tone]} font-medium`} {...rest}>
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${dotMap[tone]}`} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
