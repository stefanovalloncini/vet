import { useId } from "react";

interface Segment<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  onChange: (next: T) => void;
  segments: ReadonlyArray<Segment<T>>;
  error?: string | undefined;
  hint?: string | undefined;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  segments,
  error,
  hint,
}: SegmentedControlProps<T>) {
  const groupId = useId();
  return (
    <div>
      <span
        id={`${groupId}-label`}
        className="block text-xs uppercase tracking-wider font-medium text-(--color-text-muted) mb-2"
      >
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        className="inline-flex w-full rounded-lg border border-(--color-border) bg-(--color-surface-muted) p-0.5"
      >
        {segments.map((seg) => {
          const active = seg.value === value;
          return (
            <button
              key={seg.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={seg.disabled}
              onClick={() => onChange(seg.value)}
              className={[
                "flex-1 h-10 px-3 text-sm rounded-md transition-colors",
                "duration-(--motion-fast) ease-(--ease-out-quart)",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1",
                active
                  ? "bg-(--color-surface) text-(--color-text) font-medium shadow-[0_1px_2px_oklch(20%_0.012_240/0.06)]"
                  : "text-(--color-text-muted) hover:text-(--color-text)",
                seg.disabled ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {seg.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-(--color-danger)" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-xs text-(--color-text-subtle)">{hint}</p>
      ) : null}
    </div>
  );
}
