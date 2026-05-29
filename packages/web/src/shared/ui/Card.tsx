import type { HTMLAttributes, ReactNode } from "react";

type Padding = "none" | "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  padding?: Padding;
  elevated?: boolean;
}

const paddingMap: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card({
  children,
  padded = true,
  padding,
  elevated = false,
  className = "",
  ...rest
}: CardProps) {
  const pad = padding ?? (padded ? "md" : "none");
  const cls = [
    "bg-(--color-surface) border border-(--color-border) rounded-lg",
    paddingMap[pad],
    elevated ? "shadow-[var(--shadow-soft)]" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div {...rest} className={cls}>
      {children}
    </div>
  );
}
