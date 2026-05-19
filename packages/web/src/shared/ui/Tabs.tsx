import type { ReactNode } from "react";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  badge?: ReactNode;
  disabled?: boolean;
}

interface TabsProps<T extends string> {
  items: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (next: T) => void;
  label?: string;
  size?: "sm" | "md";
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  size = "md",
}: TabsProps<T>) {
  const padding = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex items-center gap-1 border-b border-(--color-border)"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={[
              padding,
              "inline-flex items-center gap-2 -mb-px border-b-2 transition-colors",
              active
                ? "border-(--color-accent) text-(--color-text) font-medium"
                : "border-transparent text-(--color-text-muted) hover:text-(--color-text)",
              item.disabled ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {item.label}
            {item.badge !== undefined ? (
              <span
                className={[
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] tabular-nums",
                  active
                    ? "bg-(--color-accent-soft) text-(--color-accent)"
                    : "bg-(--color-surface-muted) text-(--color-text-muted)",
                ].join(" ")}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
