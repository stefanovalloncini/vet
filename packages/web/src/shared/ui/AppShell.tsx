import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthState } from "../../features/auth";
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { Brand } from "./Brand";
import { Button } from "./Button";

interface NavItem {
  to: string;
  label: string;
  requiredCap?: string;
}

interface AppShellProps {
  children: ReactNode;
}

const NAV: NavItem[] = [
  { to: "/riepilogo", label: "Riepilogo", requiredCap: "activities.read.all" },
  { to: "/agenda", label: "Agenda", requiredCap: "activities.read.all" },
  { to: "/attivita", label: "Attività", requiredCap: "activities.read.all" },
  { to: "/aziende", label: "Aziende", requiredCap: "aziende.read" },
  { to: "/promemoria", label: "Promemoria", requiredCap: "aziende.read" },
  { to: "/pagamenti", label: "Pagamenti", requiredCap: "payments.read" },
  { to: "/cestino", label: "Cestino", requiredCap: "trash.read.own" },
];

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuthState();
  const { auth } = useRepositories();
  const location = useLocation();

  const items = NAV.filter(
    (item) => !item.requiredCap || user?.caps.has(item.requiredCap as never)
  );

  return (
    <div className="min-h-screen flex flex-col bg-(--color-background)">
      <header className="border-b border-(--color-border) bg-(--color-surface)">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <Brand size="sm" />
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {items.map((item) => {
                const active =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={[
                      "px-3 py-1.5 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-(--color-surface-muted) text-(--color-text)"
                        : "text-(--color-text-muted) hover:text-(--color-text)",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-(--color-text-muted) hidden md:inline">
              {user?.email}
            </span>
            <Link
              to="/impostazioni"
              className="text-sm text-(--color-text-muted) hover:text-(--color-text)"
            >
              Impostazioni
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => auth.signOut()}
            >
              Esci
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
