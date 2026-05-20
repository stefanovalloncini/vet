import { useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { QuickEntryFab } from "../../features/quick-entry";
import { SearchPalette } from "../../features/search";
import { InstallBanner, useTitleBadge } from "../../features/pwa-install";
import { useTheme } from "../theme/useTheme";
import { ConfirmDialog } from "./ConfirmDialog";
import { MobileHeader } from "./MobileHeader";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
  rightRail?: ReactNode;
  wide?: boolean;
}

export function AppShell({ children, rightRail, wide = false }: AppShellProps) {
  const { auth } = useRepositories();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [confirmLogout, setConfirmLogout] = useState(false);
  useTitleBadge();

  const askLogout = () => setConfirmLogout(true);
  const maxW = wide ? "max-w-[1400px]" : "max-w-6xl";

  return (
    <div className="min-h-screen flex bg-(--color-background)">
      <Sidebar theme={theme} onThemeToggle={toggle} onLogoutClick={askLogout} />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader theme={theme} onThemeToggle={toggle} onLogoutClick={askLogout} />

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

      <ConfirmDialog
        open={confirmLogout}
        title="Esci dall'account?"
        confirmLabel="Esci"
        cancelLabel="Annulla"
        onConfirm={() => {
          setConfirmLogout(false);
          void auth.signOut();
        }}
        onClose={() => setConfirmLogout(false)}
      />
    </div>
  );
}
