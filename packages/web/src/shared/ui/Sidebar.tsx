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
const SECTIONS_STORAGE_KEY = "vet.sidebarSectionsCollapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage?.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function readCollapsedSections(): ReadonlySet<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage?.getItem(SECTIONS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((x): x is string => typeof x === "string"));
    }
    return new Set();
  } catch {
    return new Set();
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
  const [collapsedSections, setCollapsedSections] = useState<ReadonlySet<string>>(
    readCollapsedSections
  );

  useEffect(() => {
    try {
      window.localStorage?.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore (e.g. jsdom test env)
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(
        SECTIONS_STORAGE_KEY,
        JSON.stringify([...collapsedSections])
      );
    } catch {
      // ignore (e.g. jsdom test env)
    }
  }, [collapsedSections]);

  function toggleSection(title: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

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
            <span
              className="min-w-0 block text-[13px] font-semibold uppercase tracking-[0.14em] text-(--color-text) truncate"
              style={{
                opacity: collapsed ? 0 : 1,
                transform: `translateX(${collapsed ? "-4px" : "0"})`,
                transition:
                  "opacity var(--motion-fast) var(--ease-out-quart), transform var(--motion-base) var(--ease-out-quart)",
              }}
            >
              Veterinario
            </span>
          </div>
        </Link>
      </div>

      <nav
        aria-label="Navigazione"
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        {visibleSections.map((section, sIdx) => {
          const expanded = !collapsedSections.has(section.title);
          return (
            <div
              key={section.title}
              className={sIdx === 0 ? "" : "border-t border-(--color-border)"}
            >
              <SidebarSectionHeader
                title={section.title}
                collapsed={collapsed}
                expanded={expanded}
                {...(collapsed
                  ? {}
                  : { onToggle: () => toggleSection(section.title) })}
              />
              <div
                className="grid overflow-hidden"
                style={{
                  gridTemplateRows: collapsed || expanded ? "1fr" : "0fr",
                  transition:
                    "grid-template-rows var(--motion-layout) var(--ease-out-quint)",
                }}
              >
                <ul className="min-h-0 overflow-hidden">
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
            </div>
          );
        })}
      </nav>

      <div className="border-t border-(--color-border)">
        <ul>
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
        </ul>
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

      <div className="border-t border-(--color-border) px-3 py-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Espandi menu" : "Riduci menu"}
          title={collapsed ? "Espandi" : "Riduci"}
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 text-(--color-text-subtle) hover:text-(--color-text) transition-colors duration-(--motion-fast) ease-(--ease-out-quart)"
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
          <div
            className="min-w-0"
            style={{
              opacity: collapsed ? 0 : 1,
              transition: "opacity var(--motion-fast) var(--ease-out-quart)",
            }}
          >
            <VersionBadge email={user?.email} />
          </div>
        </div>
      </div>
    </aside>
  );
}
