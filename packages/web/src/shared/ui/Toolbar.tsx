import type { HTMLAttributes, ReactNode } from "react";

type Gap = "sm" | "md" | "lg";
type Align = "start" | "center" | "between" | "end";

interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gap?: Gap;
  align?: Align;
  wrap?: boolean;
  vertical?: boolean;
}

const gapMap: Record<Gap, string> = {
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
};

const alignMap: Record<Align, string> = {
  start: "justify-start",
  center: "justify-center",
  between: "justify-between",
  end: "justify-end",
};

export function Toolbar({
  children,
  gap = "md",
  align = "start",
  wrap = true,
  vertical = false,
  className = "",
  ...rest
}: ToolbarProps) {
  const cls = [
    "flex items-center",
    vertical ? "flex-col items-stretch" : "flex-row",
    gapMap[gap],
    alignMap[align],
    wrap ? "flex-wrap" : "flex-nowrap",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div {...rest} className={cls} role={rest.role ?? "toolbar"}>
      {children}
    </div>
  );
}
