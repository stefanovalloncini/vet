import type { ReactNode } from "react";

interface FieldGroupProps {
  legend?: string;
  description?: string;
  /** Spec-aligned alias of `description`. */
  hint?: string;
  children: ReactNode;
  /** Layout: stacked (default) or 2-column grid on sm+. */
  layout?: "stack" | "grid-2";
}

export function FieldGroup({
  legend,
  description,
  hint,
  children,
  layout = "stack",
}: FieldGroupProps) {
  const subtext = description ?? hint;
  const innerClass =
    layout === "grid-2"
      ? "grid grid-cols-1 sm:grid-cols-2 gap-5"
      : "space-y-5";
  return (
    <fieldset className="border-0 p-0 m-0">
      {legend ? (
        <legend className="block text-xs uppercase tracking-wider font-medium text-(--color-text-muted) mb-2">
          {legend}
        </legend>
      ) : null}
      {subtext ? (
        <p className="mb-3 text-xs text-(--color-text-subtle)">{subtext}</p>
      ) : null}
      <div className={innerClass}>{children}</div>
    </fieldset>
  );
}
