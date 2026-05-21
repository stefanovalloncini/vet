import type { ReactNode } from "react";

interface FormFooterProps {
  actions: ReactNode;
  destructive?: ReactNode;
}

export function FormFooter({ actions, destructive }: FormFooterProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
      <div>{destructive}</div>
      <div className="flex items-center gap-3">{actions}</div>
    </div>
  );
}
