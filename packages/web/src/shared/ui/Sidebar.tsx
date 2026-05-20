import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  LogOut,
  Settings,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Building2,
  Bell,
  Wallet,
  BarChart3,
  Wrench,
  Tags,
  ShieldCheck,
  KeyRound,
  ScrollText,
  Users,
  Trash2,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react";
import { useAuthState } from "../../features/auth";
import { BrandMark } from "./Brand";
import { SidebarSectionHeader } from "./SidebarSectionHeader";
import { SidebarNavLink } from "./SidebarNavLink";
import { SidebarActionRow } from "./SidebarActionRow";
import { VersionBadge } from "./VersionBadge";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  requiredCap?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Operatività",
    items: [
      { to: "/riepilogo", label: "Riepilogo", icon: LayoutDashboard, requiredCap: "activities.read.all" },
      { to: "/agenda", label: "Agenda", icon: Calendar, requiredCap: "activities.read.all" },
      { to: "/attivita", label: "Attività", icon: ClipboardList, requiredCap: "activities.read.all" },
      { to: "/aziende", label: "Aziende", icon: Building2, requiredCap: "aziende.read" },
      { to: "/promemoria", label: "Promemoria", icon: Bell, requiredCap: "reminders.read" },
    ],
  },
  {
    title: "Gestione",
    items: [
      { to: "/pagamenti", label: "Pagamenti", icon: Wallet, requiredCap: "payments.read" },
      { to: "/statistiche", label: "Statistiche", icon: BarChart3, requiredCap: "activities.read.all" },
      { to: "/strumenti", label: "Strumenti", icon: Wrench },
    ],
  },
  {
    title: "Amministrazione",
    items: [
      { to: "/admin/tipi-attivita", label: "Tipi attività", icon: Tags, requiredCap: "activity_types.read" },
      { to: "/admin/ruoli", label: "Ruoli", icon: ShieldCheck, requiredCap: "roles.read" },
      { to: "/admin/allowlist", label: "Allowlist", icon: KeyRound, requiredCap: "allowlist.read" },
      { to: "/admin/audit", label: "Audit", icon: ScrollText, requiredCap: "audit.read" },
      { to: "/admin/stats-vet", label: "Statistiche veterinari", icon: Users, requiredCap: "users.read.all" },
    ],
  },
];

const FOOTER_ITEMS: NavItem[] = [
  { to: "/cestino", label: "Cestino", icon: Trash2, requiredCap: "trash.read.own" },
  { to: "/impostazioni", label: "Impostazioni", icon: Settings },
];

const COLLAPSED_STORAGE_KEY = "vet.sidebarCollapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage?.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(to + "/");
}

function visibleItems(items: NavItem[], caps?: ReadonlySet<string>): NavItem[] {
  return items.filter((item) => !item.requiredCap || caps?.has(item.requiredCap));
}

interface SidebarProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onLogoutClick: () => void;
}

export function Sidebar({ theme, onThemeToggle, onLogoutClick }: SidebarProps) {
  const { user } = useAuthState();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    try {
      window.localStorage?.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore (e.g. jsdom test env)
    }
  }, [collapsed]);

  const caps = user?.caps as ReadonlySet<string> | undefined;
  const visibleSections = SECTIONS.map((s) => ({
    ...s,
    items: visibleItems(s.items, caps),
  })).filter((s) => s.items.length > 0);
  const visibleFooter = visibleItems(FOOTER_ITEMS, caps);
  const sidebarWidth = collapsed ? "3.5rem" : "14.5rem";

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      style={{
        width: sidebarWidth,
        transition: "width var(--motion-layout) var(--ease-out-quint)",
      }}
      className="hidden sm:flex sm:flex-col shrink-0 border-r border-(--color-border) bg-(--color-surface) sticky top-0 h-screen overflow-hidden"
    >
      <div className="h-14 flex items-center px-3 border-b border-(--color-border)">
        <Link
          to="/"
          className="flex items-center min-w-0 w-full gap-2.5"
          aria-label="Veterinario · home"
        >
          <BrandMark size={22} className="shrink-0" />
          <div
            className="overflow-hidden grid"
            style={{
              gridTemplateColumns: collapsed ? "0fr" : "1fr",
              transition: "grid-template-columns var(--motion-layout) var(--ease-out-quint)",
            }}
          >
            <div className="min-w-0">
              <div
                className="flex flex-col leading-tight"
                style={{
                  opacity: collapsed ? 0 : 1,
                  transform: `translateX(${collapsed ? "-4px" : "0"})`,
                  transition:
                    "opacity var(--motion-fast) var(--ease-out-quart), transform var(--motion-base) var(--ease-out-quart)",
                }}
              >
                <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-(--color-text) truncate">
                  Veterinario
                </span>
                {user?.displayName ? (
                  <span className="text-[11px] text-(--color-text-muted) truncate mt-0.5">
                    {user.displayName}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </Link>
      </div>

      <nav
        aria-label="Navigazione"
        className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1.5 space-y-1"
      >
        {visibleSections.map((section, sIdx) => (
          <div key={section.title} className="space-y-0.5">
            <SidebarSectionHeader title={section.title} collapsed={collapsed} first={sIdx === 0} />
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarNavLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  active={isActive(location.pathname, item.to)}
                  collapsed={collapsed}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-(--color-border) px-1.5 py-2 space-y-0.5">
        {visibleFooter.map((item) => (
          <SidebarNavLink
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            active={isActive(location.pathname, item.to)}
            collapsed={collapsed}
          />
        ))}
        <SidebarActionRow
          onClick={onThemeToggle}
          icon={theme === "dark" ? Sun : Moon}
          label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
          collapsed={collapsed}
        />
        <SidebarActionRow
          onClick={onLogoutClick}
          icon={LogOut}
          label="Esci"
          collapsed={collapsed}
        />
      </div>

      <div className="border-t border-(--color-border) px-2 py-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Espandi menu" : "Riduci menu"}
          title={collapsed ? "Espandi" : "Riduci"}
          className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-(--color-text-subtle) hover:bg-(--color-surface-muted) hover:text-(--color-text) transition-[background-color,color] duration-(--motion-fast) ease-(--ease-out-quart)"
        >
          <span
            className="inline-flex"
            style={{
              transform: `rotate(${collapsed ? "180deg" : "0deg"})`,
              transition: "transform var(--motion-layout) var(--ease-out-quint)",
            }}
          >
            <PanelLeftClose size={15} strokeWidth={1.75} aria-hidden="true" />
          </span>
        </button>
        <div
          className="min-w-0 grid overflow-hidden"
          style={{
            gridTemplateColumns: collapsed ? "0fr" : "1fr",
            transition: "grid-template-columns var(--motion-layout) var(--ease-out-quint)",
          }}
        >
          <div className="min-w-0">
            <div
              style={{
                opacity: collapsed ? 0 : 1,
                transition: "opacity var(--motion-fast) var(--ease-out-quart)",
              }}
            >
              <p className="text-[10.5px] text-(--color-text-subtle) truncate leading-tight">
                {user?.email}
              </p>
              <VersionBadge />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
