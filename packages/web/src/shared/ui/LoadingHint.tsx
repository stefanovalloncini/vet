interface LoadingHintProps {
  label?: string;
  className?: string;
}

export function LoadingHint({
  label = "Caricamento…",
  className = "",
}: LoadingHintProps) {
  const cls = ["text-sm text-(--color-text-muted)", className]
    .filter(Boolean)
    .join(" ");
  return <p className={cls}>{label}</p>;
}
