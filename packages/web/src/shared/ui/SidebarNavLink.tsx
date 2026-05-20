import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface SidebarNavLinkProps {
  to: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}

export function SidebarNavLink({ to, label, icon: Icon, active, collapsed }: SidebarNavLinkProps) {
  return (
    <li>
      <Link
        to={to}
        title={collapsed ? label : undefined}
        aria-label={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={[
          "relative flex items-center h-8 gap-2.5 px-2 rounded-md text-[13px] outline-none",
          "transition-[color,background-color] duration-(--motion-fast) ease-(--ease-out-quart)",
          active
            ? "bg-(--color-accent-soft) text-(--color-accent) font-medium"
            : "text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text)",
        ].join(" ")}
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
            className="min-w-0 truncate"
            style={{
              opacity: collapsed ? 0 : 1,
              transition: "opacity var(--motion-fast) var(--ease-out-quart)",
            }}
          >
            {label}
          </span>
        </div>
      </Link>
    </li>
  );
}
