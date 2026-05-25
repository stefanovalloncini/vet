import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Capability } from "@vet/shared";
import { useAuthState } from "../../features/auth";
import { AppShell } from "./AppShell";

interface AdminNavItem {
  to: string;
  label: string;
  requiredCap: Capability;
}

const ADMIN_NAV: ReadonlyArray<AdminNavItem> = [
  { to: "/admin/tipi-attivita", label: "Tipi", requiredCap: "activity_types.read" },
  { to: "/admin/allowlist", label: "Allowlist", requiredCap: "allowlist.read" },
  { to: "/admin/ruoli", label: "Ruoli", requiredCap: "roles.read" },
  { to: "/admin/audit", label: "Audit", requiredCap: "audit.read" },
  { to: "/admin/stats-vet", label: "Statistiche", requiredCap: "users.read.all" },
];

function isActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}

interface AdminLayoutProps {
  children: ReactNode;
  wide?: boolean;
}

export function AdminLayout({ children, wide = false }: AdminLayoutProps) {
  const { user } = useAuthState();
  const location = useLocation();
  const items = ADMIN_NAV.filter((item) => user?.caps.has(item.requiredCap));

  return (
    <AppShell wide={wide}>
      {items.length > 1 ? (
        <nav
          aria-label="Amministrazione"
          className="sm:hidden -mx-4 px-4 mb-5 border-b border-(--color-border) overflow-x-auto"
        >
          <ul className="flex items-center gap-1 min-w-max">
            {items.map((item) => {
              const active = isActive(location.pathname, item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "inline-flex items-center h-11 px-3 -mb-px border-b-2 text-sm transition-[color,border-color] duration-(--motion-fast) ease-(--ease-out-quart) whitespace-nowrap focus:outline-none focus-visible:bg-(--color-surface-muted)",
                      active
                        ? "border-(--color-accent) text-(--color-accent) font-medium"
                        : "border-transparent text-(--color-text-muted) hover:text-(--color-text)",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
      {children}
    </AppShell>
  );
}
