import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, LogOut, PanelLeftClose, Search, Keyboard, type LucideIcon } from "lucide-react";
import { useAuthState } from "../../features/auth";
import { openSearch } from "../../features/search";
import { BrandMark } from "./Brand";
import { SHORTCUTS_OPEN_EVENT } from "./ShortcutsDialog";
import { SidebarSectionHeader } from "./SidebarSectionHeader";
import { SidebarNavLink } from "./SidebarNavLink";
import { SidebarActionRow } from "./SidebarActionRow";
import { VersionBadge } from "./VersionBadge";
import {
  NAV_SECTIONS,
  FOOTER_ITEMS,
  isActivePath,
  visibleItems,
} from "./sidebar/SidebarConfig";
import { useSidebarPersistence } from "./sidebar/useSidebarPersistence";
import { useSidebarSections } from "./sidebar/useSidebarSections";

interface SidebarProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onLogoutClick: () => void;
}

export function Sidebar({ theme, onThemeToggle, onLogoutClick }: SidebarProps) {
  const { user } = useAuthState();
  const location = useLocation();
  const caps = user?.caps as ReadonlySet<string> | undefined;
  const { collapsed, setCollapsed } = useSidebarPersistence();
  const { collapsedSections, toggleSection } = useSidebarSections(location.pathname, caps);

  const visibleSections = NAV_SECTIONS.map((s) => ({
    ...s,
    items: visibleItems(s.items, caps),
  })).filter((s) => s.items.length > 0);
  const visibleFooter = visibleItems(FOOTER_ITEMS, caps);
  const rowFor = (to: string, label: string, icon: LucideIcon) => (
    <SidebarNavLink
      key={to}
      to={to}
      label={label}
      icon={icon}
      active={isActivePath(location.pathname, to)}
      collapsed={collapsed}
    />
  );

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      style={{
        width: collapsed ? "3.5rem" : "14.5rem",
        transition: "width var(--motion-layout) var(--ease-out-quint)",
      }}
      className="hidden sm:flex sm:flex-col shrink-0 border-r border-(--color-border) bg-(--color-surface) sticky top-0 h-screen overflow-hidden"
    >
      <div className="h-14 flex items-center px-3 border-b border-(--color-border)">
        <Link to="/" className="flex items-center min-w-0 w-full gap-2.5" aria-label="Veterinario · home">
          <BrandMark size={22} className="shrink-0" />
          <div
            className="overflow-hidden grid"
            style={{
              gridTemplateColumns: collapsed ? "0fr" : "1fr",
              transition: "grid-template-columns var(--motion-layout) var(--ease-out-quint)",
            }}
          >
            <div
              className="min-w-0 flex flex-col leading-tight"
              style={{
                opacity: collapsed ? 0 : 1,
                transform: `translateX(${collapsed ? "-4px" : "0"})`,
                transition:
                  "opacity var(--motion-fast) var(--ease-out-quart), transform var(--motion-base) var(--ease-out-quart)",
              }}
            >
              <span className="min-w-0 block text-[13px] font-semibold uppercase tracking-[0.14em] text-(--color-text) truncate">
                Veterinario
              </span>
              {user ? (
                <span className="min-w-0 block text-[11px] text-(--color-text-muted) truncate">
                  {user.displayName || user.email}
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      </div>

      <nav aria-label="Navigazione" className="flex-1 overflow-y-auto overflow-x-hidden">
        {visibleSections.map((section, sIdx) => {
          const expanded = !collapsedSections.has(section.title);
          return (
            <div key={section.title} className={sIdx === 0 ? "" : "border-t border-(--color-border)"}>
              <SidebarSectionHeader
                title={section.title}
                collapsed={collapsed}
                expanded={expanded}
                {...(collapsed ? {} : { onToggle: () => toggleSection(section.title) })}
              />
              <div
                className="grid overflow-hidden"
                style={{
                  gridTemplateRows: collapsed || expanded ? "1fr" : "0fr",
                  transition: "grid-template-rows var(--motion-layout) var(--ease-out-quint)",
                }}
              >
                <ul className="min-h-0 overflow-hidden">
                  {section.items.map((item) => rowFor(item.to, item.label, item.icon))}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-(--color-border)">
        <ul>{visibleFooter.map((item) => rowFor(item.to, item.label, item.icon))}</ul>
        <div className="border-t border-(--color-border) pt-1 mt-1">
          <SidebarActionRow
            onClick={openSearch}
            icon={Search}
            label="Cerca (⌘K)"
            collapsed={collapsed}
            ariaKeyshortcuts="Meta+K Control+K"
          />
          <SidebarActionRow
            onClick={() => window.dispatchEvent(new CustomEvent(SHORTCUTS_OPEN_EVENT))}
            icon={Keyboard}
            label="Scorciatoie (?)"
            collapsed={collapsed}
            ariaKeyshortcuts="?"
          />
          <SidebarActionRow
            onClick={onThemeToggle}
            icon={theme === "dark" ? Sun : Moon}
            label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
            collapsed={collapsed}
          />
          <SidebarActionRow onClick={onLogoutClick} icon={LogOut} label="Esci" collapsed={collapsed} />
        </div>
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
