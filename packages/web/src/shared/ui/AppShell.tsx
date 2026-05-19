import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthState } from "../../features/auth";
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { QuickEntryFab } from "../../features/quick-entry";
import { SearchPalette } from "../../features/search";
import { InstallBanner, useTitleBadge } from "../../features/pwa-install";
import { useTheme } from "../theme/useTheme";
import { Brand } from "./Brand";
import { MobileNav } from "./MobileNav";

interface NavItem {
  to: string;
  label: string;
  requiredCap?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AppShellProps {
  children: ReactNode;
}

const SECTIONS: NavSection[] = [
  {
    title: "Operatività",
    items: [
      { to: "/riepilogo", label: "Riepilogo", requiredCap: "activities.read.all" },
      { to: "/agenda", label: "Agenda", requiredCap: "activities.read.all" },
      { to: "/attivita", label: "Attività", requiredCap: "activities.read.all" },
      { to: "/aziende", label: "Aziende", requiredCap: "aziende.read" },
      { to: "/promemoria", label: "Promemoria", requiredCap: "reminders.read" },
    ],
  },
  {
    title: "Gestione",
    items: [
      { to: "/pagamenti", label: "Pagamenti", requiredCap: "payments.read" },
      { to: "/statistiche", label: "Statistiche", requiredCap: "activities.read.all" },
      { to: "/strumenti", label: "Strumenti" },
    ],
  },
  {
    title: "Amministrazione",
    items: [
      { to: "/admin/tipi-attivita", label: "Tipi attività", requiredCap: "activity_types.read" },
      { to: "/admin/ruoli", label: "Ruoli", requiredCap: "roles.read" },
      { to: "/admin/allowlist", label: "Allowlist", requiredCap: "allowlist.read" },
      { to: "/admin/audit", label: "Audit", requiredCap: "audit.read" },
      { to: "/admin/stats-vet", label: "Statistiche veterinari", requiredCap: "users.read.all" },
    ],
  },
];

const FOOTER_ITEMS: NavItem[] = [
  { to: "/cestino", label: "Cestino", requiredCap: "trash.read.own" },
  { to: "/impostazioni", label: "Impostazioni" },
];

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(to + "/");
}

function visibleItems(items: NavItem[], caps?: ReadonlySet<string>): NavItem[] {
  return items.filter(
    (item) => !item.requiredCap || caps?.has(item.requiredCap)
  );
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuthState();
  const { auth } = useRepositories();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  useTitleBadge();

  const visibleSections = SECTIONS.map((s) => ({
    ...s,
    items: visibleItems(s.items, user?.caps as ReadonlySet<string> | undefined),
  })).filter((s) => s.items.length > 0);

  const visibleFooter = visibleItems(
    FOOTER_ITEMS,
    user?.caps as ReadonlySet<string> | undefined
  );

  return (
    <div className="min-h-screen flex bg-(--color-background)">
      <aside className="hidden sm:flex sm:flex-col w-60 shrink-0 border-r border-(--color-border) bg-(--color-surface) sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-(--color-border)">
          <Link to="/" className="inline-flex">
            <Brand size="md" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <p className="px-2 mb-2 text-[10px] uppercase tracking-[0.12em] text-(--color-text-subtle)">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(location.pathname, item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={[
                          "block px-2 py-1.5 rounded-md text-sm transition-colors",
                          active
                            ? "bg-(--color-accent-soft) text-(--color-accent) font-medium"
                            : "text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text)",
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-(--color-border) px-3 py-3 space-y-0.5">
          {visibleFooter.map((item) => {
            const active = isActive(location.pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "block px-2 py-1.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-(--color-accent-soft) text-(--color-accent) font-medium"
                    : "text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text)",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro"}
            className="w-full text-left px-2 py-1.5 rounded-md text-sm text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text) transition-colors"
          >
            {theme === "dark" ? "Tema chiaro" : "Tema scuro"}
          </button>
          <button
            type="button"
            onClick={() => auth.signOut()}
            className="w-full text-left px-2 py-1.5 rounded-md text-sm text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text) transition-colors"
          >
            Esci
          </button>
        </div>

        <div className="border-t border-(--color-border) px-5 py-3 text-[11px] text-(--color-text-subtle) truncate">
          {user?.email}
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
              className="px-2 py-1 text-xs text-(--color-text-muted) hover:text-(--color-text)"
            >
              {theme === "dark" ? "Chiaro" : "Scuro"}
            </button>
            <Link
              to="/impostazioni"
              className="px-2 py-1 text-xs text-(--color-text-muted) hover:text-(--color-text)"
            >
              Impostazioni
            </Link>
            <button
              type="button"
              onClick={() => auth.signOut()}
              className="px-2 py-1 text-xs text-(--color-text-muted) hover:text-(--color-text)"
            >
              Esci
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl px-6 py-8 pb-24 sm:pb-8 sm:px-8">
          {children}
        </main>
      </div>

      <MobileNav />
      <SearchPalette />
      <QuickEntryFab />
      <InstallBanner />
    </div>
  );
}
