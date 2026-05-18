import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: ReadonlyArray<SelectOption>;
  error?: string | undefined;
  hint?: string | undefined;
}

export function Select({
  id,
  label,
  options,
  error,
  hint,
  className = "",
  ...rest
}: SelectProps) {
  const cls = [
    "w-full rounded-xl border bg-(--color-surface) px-4 py-3 text-sm text-(--color-text)",
    "focus:outline-none focus:ring-2 disabled:opacity-50 appearance-none",
    "bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%236b6b73%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><polyline%20points=%226%209%2012%2015%2018%209%22/></svg>')] bg-no-repeat bg-[right_1rem_center] pr-10",
    error
      ? "border-(--color-danger) focus:border-(--color-danger) focus:ring-(--color-danger)/20"
      : "border-(--color-border) focus:border-(--color-accent) focus:ring-(--color-accent)/20",
    className,
  ].join(" ");

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs uppercase tracking-wider font-medium text-(--color-text-muted) mb-2"
      >
        {label}
      </label>
      <select id={id} {...rest} className={cls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
