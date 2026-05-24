import type { ReactNode } from "react";

interface SettingsRowProps {
  label: string;
  description?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}

export function SettingsRow({ label, description, htmlFor, children }: SettingsRowProps) {
  const labelEl = htmlFor ? (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-(--color-text)">
      {label}
    </label>
  ) : (
    <p className="text-sm font-medium text-(--color-text)">{label}</p>
  );

  return (
    <div className="py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        {labelEl}
        {description ? (
          <p className="text-xs text-(--color-text-muted) mt-1 max-w-prose">{description}</p>
        ) : null}
      </div>
      <div className="text-sm text-(--color-text) sm:shrink-0 sm:text-right">
        {children}
      </div>
    </div>
  );
}
