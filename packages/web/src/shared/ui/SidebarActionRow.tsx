import type { LucideIcon } from "lucide-react";

interface SidebarActionRowProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  ariaKeyshortcuts?: string;
}

export function SidebarActionRow({
  onClick,
  icon: Icon,
  label,
  collapsed,
  ariaKeyshortcuts,
}: SidebarActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={label}
      {...(ariaKeyshortcuts ? { "aria-keyshortcuts": ariaKeyshortcuts } : {})}
      className="w-full flex items-center h-9 gap-2.5 pl-3 pr-2 text-[13px] text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text) transition-colors duration-(--motion-fast) ease-(--ease-out-quart)"
    >
      <Icon size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: collapsed ? "0fr" : "1fr",
          transition: "grid-template-columns var(--motion-layout) var(--ease-out-quint)",
        }}
      >
        <span
          className="min-w-0 truncate text-left"
          style={{
            opacity: collapsed ? 0 : 1,
            transition: "opacity var(--motion-layout) var(--ease-out-quint)",
          }}
        >
          {label}
        </span>
      </div>
    </button>
  );
}
