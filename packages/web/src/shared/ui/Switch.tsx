import { useId } from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={[
        "inline-flex items-center gap-3 text-sm text-(--color-text) select-none",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <span className="relative inline-flex h-6 w-10 items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
          disabled={disabled}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={[
            "absolute inset-0 rounded-full transition-colors duration-(--motion-fast) ease-(--ease-out-quart)",
            "bg-(--color-surface-muted) border border-(--color-border)",
            "peer-checked:bg-(--color-accent) peer-checked:border-(--color-accent)",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-(--color-accent) peer-focus-visible:ring-offset-2",
          ].join(" ")}
        />
        <span
          aria-hidden="true"
          className={[
            "relative ml-0.5 h-5 w-5 rounded-full bg-(--color-surface)",
            "shadow-[0_1px_2px_oklch(20%_0.012_240/0.18)]",
            "transition-transform duration-(--motion-fast) ease-(--ease-out-quart)",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </span>
      <span>{label}</span>
    </label>
  );
}
