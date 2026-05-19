import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
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
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { QuickEntryFab } from "../../features/quick-entry";
import { SearchPalette } from "../../features/search";
import { InstallBanner, useTitleBadge } from "../../features/pwa-install";
import { useTheme } from "../theme/useTheme";
import { Brand, BrandMark } from "./Brand";
import { MobileNav } from "./MobileNav";
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

interface AppShellProps {
  children: ReactNode;
  rightRail?: ReactNode;
  wide?: boolean;
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
  return items.filter(
    (item) => !item.requiredCap || caps?.has(item.requiredCap)
  );
}

export function AppShell({ children, rightRail, wide = false }: AppShellProps) {
  const { user } = useAuthState();
  const { auth } = useRepositories();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  useTitleBadge();

  useEffect(() => {
    try {
      window.localStorage?.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore (e.g. jsdom test env)
    }
  }, [collapsed]);

  const visibleSections = SECTIONS.map((s) => ({
    ...s,
    items: visibleItems(s.items, user?.caps as ReadonlySet<string> | undefined),
  })).filter((s) => s.items.length > 0);

  const visibleFooter = visibleItems(
    FOOTER_ITEMS,
    user?.caps as ReadonlySet<string> | undefined
  );

  const sidebarWidth = collapsed ? "3.5rem" : "14.5rem";
  const maxW = wide ? "max-w-[1400px]" : "max-w-6xl";

  return (
    <div className="min-h-screen flex bg-(--color-background)">
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
              <SectionHeader title={section.title} collapsed={collapsed} first={sIdx === 0} />
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    item={item}
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
            <NavLink
              key={item.to}
              item={item}
              active={isActive(location.pathname, item.to)}
              collapsed={collapsed}
            />
          ))}
          <ActionRow
            onClick={toggle}
            icon={theme === "dark" ? Sun : Moon}
            label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
            collapsed={collapsed}
          />
          <ActionRow
            onClick={() => auth.signOut()}
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sm:hidden border-b border-(--color-border) bg-(--color-surface) px-4 h-12 flex items-center justify-between">
          <Link to="/" className="inline-flex">
            <Brand size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
              className="p-2 text-(--color-text-muted) hover:text-(--color-text) transition-colors"
            >
              {theme === "dark" ? (
                <Sun size={16} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Moon size={16} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
            <Link
              to="/impostazioni"
              aria-label="Impostazioni"
              className="p-2 text-(--color-text-muted) hover:text-(--color-text) transition-colors"
            >
              <Settings size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => auth.signOut()}
              aria-label="Esci"
              className="p-2 text-(--color-text-muted) hover:text-(--color-text) transition-colors"
            >
              <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main
          key={location.pathname}
          className={`flex-1 w-full ${maxW} px-5 py-6 pb-24 sm:pb-6 sm:px-7 animate-fade-in`}
        >
          {rightRail ? (
            <div className="lg:grid lg:grid-cols-3 lg:gap-6">
              <div className="lg:col-span-2 min-w-0">{children}</div>
              <aside className="mt-6 lg:mt-0 space-y-4">{rightRail}</aside>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      <MobileNav />
      <SearchPalette />
      <QuickEntryFab />
      <InstallBanner />
    </div>
  );
}

function SectionHeader({
  title,
  collapsed,
  first,
}: {
  title: string;
  collapsed: boolean;
  first: boolean;
}) {
  return (
    <div
      className="grid overflow-hidden"
      style={{
        gridTemplateRows: collapsed ? "0fr" : "1fr",
        transition: "grid-template-rows var(--motion-layout) var(--ease-out-quint)",
        marginTop: collapsed ? "0" : first ? "0.25rem" : "0.625rem",
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <p
          className="px-2 pb-1 text-[10px] uppercase tracking-[0.12em] text-(--color-text-subtle)"
          style={{
            opacity: collapsed ? 0 : 1,
            transition: "opacity var(--motion-fast) var(--ease-out-quart)",
          }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        to={item.to}
        title={collapsed ? item.label : undefined}
        aria-label={collapsed ? item.label : undefined}
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
            {item.label}
          </span>
        </div>
      </Link>
    </li>
  );
}

function ActionRow({
  onClick,
  icon: Icon,
  label,
  collapsed,
}: {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={label}
      className="w-full flex items-center h-8 gap-2.5 px-2 rounded-md text-[13px] text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text) transition-[color,background-color] duration-(--motion-fast) ease-(--ease-out-quart)"
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
            transition: "opacity var(--motion-fast) var(--ease-out-quart)",
          }}
        >
          {label}
        </span>
      </div>
    </button>
  );
}
