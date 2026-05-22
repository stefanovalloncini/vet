import type { HTMLAttributes, ReactNode } from "react";

interface BoxedListProps extends HTMLAttributes<HTMLUListElement> {
  children: ReactNode;
}

export function BoxedList({ children, className = "", ...rest }: BoxedListProps) {
  const cls = [
    "bg-(--color-surface) border border-(--color-border) rounded-2xl overflow-hidden divide-y divide-(--color-border)",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <ul {...rest} className={cls}>
      {children}
    </ul>
  );
}
