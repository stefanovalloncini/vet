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
    <li className="relative">
      {active ? (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-(--color-accent) rounded-r-sm"
        />
      ) : null}
      <Link
        to={to}
        title={collapsed ? label : undefined}
        aria-label={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={[
          "flex items-center h-9 gap-2.5 pl-3 pr-2 text-[13px] outline-none",
          "transition-colors duration-(--motion-fast) ease-(--ease-out-quart)",
          active
            ? "text-(--color-text) font-medium"
            : "text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text)",
        ].join(" ")}
      >
        <Icon
          size={15}
          strokeWidth={1.75}
          aria-hidden="true"
          className={["shrink-0", active ? "text-(--color-accent)" : ""].join(" ")}
        />
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
              transition: "opacity var(--motion-layout) var(--ease-out-quint)",
            }}
          >
            {label}
          </span>
        </div>
      </Link>
    </li>
  );
}
