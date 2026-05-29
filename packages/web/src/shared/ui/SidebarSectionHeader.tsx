import { ChevronDown } from "lucide-react";

interface SidebarSectionHeaderProps {
  title: string;
  collapsed: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export function SidebarSectionHeader({
  title,
  collapsed,
  expanded,
  onToggle,
}: SidebarSectionHeaderProps) {
  return (
    <div
      className="grid overflow-hidden"
      style={{
        gridTemplateRows: collapsed ? "0fr" : "1fr",
        transition: "grid-template-rows var(--motion-layout) var(--ease-out-quint)",
      }}
    >
      <div className="min-h-0 overflow-hidden">
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded ?? true}
            className="w-full flex items-center justify-between px-3 pt-3 pb-1.5 text-[11px] uppercase tracking-[0.14em] text-(--color-text-subtle) font-medium hover:text-(--color-text-muted) transition-colors duration-(--motion-fast) ease-(--ease-out-quart)"
            style={{
              opacity: collapsed ? 0 : 1,
              transition: "opacity var(--motion-layout) var(--ease-out-quint)",
            }}
          >
            <span>{title}</span>
            <span
              className="inline-flex"
              style={{
                transform: `rotate(${expanded === false ? "-90deg" : "0deg"})`,
                transition: "transform var(--motion-fast) var(--ease-out-quart)",
              }}
            >
              <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
            </span>
          </button>
        ) : (
          <p
            className="px-3 pt-3 pb-1.5 text-[11px] uppercase tracking-[0.14em] text-(--color-text-subtle) font-medium"
            style={{
              opacity: collapsed ? 0 : 1,
              transition: "opacity var(--motion-layout) var(--ease-out-quint)",
            }}
          >
            {title}
          </p>
        )}
      </div>
    </div>
  );
}
