import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 20, label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ?? "Caricamento"}
      className="inline-flex items-center gap-2 text-(--color-text-muted)"
    >
      <Loader2
        size={size}
        strokeWidth={1.75}
        className="animate-spin text-(--color-accent)"
        aria-hidden="true"
      />
      {label ? <span className="text-sm">{label}</span> : null}
    </span>
  );
}
