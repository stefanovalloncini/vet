import type { ReactNode } from "react";

interface InlineErrorProps {
  children: ReactNode;
  className?: string;
}

export function InlineError({ children, className = "" }: InlineErrorProps) {
  const cls = ["text-sm text-(--color-danger)", className]
    .filter(Boolean)
    .join(" ");
  return (
    <p role="alert" className={cls}>
      {children}
    </p>
  );
}
