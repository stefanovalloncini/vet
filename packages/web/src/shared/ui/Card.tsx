import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  elevated?: boolean;
}

export function Card({
  children,
  padded = true,
  elevated = false,
  className = "",
  ...rest
}: CardProps) {
  const cls = [
    "bg-(--color-surface) border border-(--color-border) rounded-2xl transition-[border-color,box-shadow,background-color] duration-(--motion-fast) ease-(--ease-out-quart)",
    padded ? "p-5 sm:p-6" : "",
    elevated ? "shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "",
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
