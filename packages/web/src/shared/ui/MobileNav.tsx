import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Building2,
  Euro,
  type LucideIcon,
} from "lucide-react";
import { useAuthState } from "../../features/auth";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  requiredCap?: string;
}

const ITEMS: NavItem[] = [
  { to: "/riepilogo", label: "Riepilogo", icon: LayoutDashboard, requiredCap: "activities.read.all" },
  { to: "/agenda", label: "Agenda", icon: Calendar, requiredCap: "activities.read.all" },
  { to: "/attivita", label: "Attività", icon: ClipboardList, requiredCap: "activities.read.all" },
  { to: "/aziende", label: "Aziende", icon: Building2, requiredCap: "aziende.read" },
  { to: "/pagamenti", label: "Pagamenti", icon: Euro, requiredCap: "payments.read" },
];

export function MobileNav() {
  const { user } = useAuthState();
  const location = useLocation();
  const items = ITEMS.filter(
    (it) => !it.requiredCap || user?.caps.has(it.requiredCap as never)
  );
  if (items.length === 0) return null;
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t border-(--color-border) bg-(--color-surface) print:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigazione principale"
    >
      <div className="flex">
        {items.map((it) => {
          const active = location.pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={[
                "flex-1 flex flex-col items-center gap-1 py-2 text-[11px]",
                active
                  ? "text-(--color-accent)"
                  : "text-(--color-text-muted)",
              ].join(" ")}
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
