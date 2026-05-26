import { Spinner } from "./Spinner";

interface LoadingHintProps {
  label?: string;
  className?: string;
}

export function LoadingHint({
  label = "Caricamento…",
  className = "",
}: LoadingHintProps) {
  const cls = [
    "flex items-center gap-2 text-sm text-(--color-text-muted)",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div role="status" aria-live="polite" className={cls}>
      <Spinner size={16} />
      <span>{label}</span>
    </div>
  );
}
