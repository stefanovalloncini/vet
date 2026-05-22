import type { ElementType, ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

export function SectionLabel({
  children,
  as: Tag = "p",
  className = "",
}: SectionLabelProps) {
  const cls = [
    "text-xs uppercase tracking-wider text-(--color-text-muted)",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <Tag className={cls}>{children}</Tag>;
}
