import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="border-t border-(--color-border) first:border-t-0">
      <h2 className="text-xs uppercase tracking-wider text-(--color-text-muted) font-semibold pt-6 pb-1">
        {title}
      </h2>
      <div className="divide-y divide-(--color-border)">{children}</div>
    </section>
  );
}
