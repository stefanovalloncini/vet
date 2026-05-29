import { useLocation } from "react-router-dom";
import { useCallback, useState, type ReactNode } from "react";
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { useAuthState, useSessionGuard } from "../../features/auth";
import { QuickEntryFab } from "../../features/quick-entry";
import { SearchPalette } from "../../features/search";
import { InstallBanner, useTitleBadge } from "../../features/pwa-install";
import { useBackupReminder } from "../../features/cestino";
import { useTheme } from "../theme/useTheme";
import { ConfirmDialog } from "./ConfirmDialog";
import { MobileHeader } from "./MobileHeader";
import { MobileNav } from "./MobileNav";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { Sidebar } from "./Sidebar";
import { useToast } from "./Toast";

interface AppShellProps {
  children: ReactNode;
  rightRail?: ReactNode;
  wide?: boolean;
}

export function AppShell({ children, rightRail, wide = false }: AppShellProps) {
  const { auth } = useRepositories();
  const { user } = useAuthState();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { notify } = useToast();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useTitleBadge();

  const onRevoked = useCallback(() => {
    notify(
      "Accesso revocato. La sessione è stata chiusa.",
      "error"
    );
    void auth.signOut();
  }, [auth, notify]);

  useSessionGuard({ auth, uid: user?.uid ?? null, onRevoked });
  useBackupReminder();

  const askLogout = () => setConfirmLogout(true);
  const maxW = wide ? "max-w-none" : "max-w-[1600px]";

  return (
    <div className="min-h-screen flex bg-(--color-background)">
      <a
        href="#contenuto-principale"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-(--color-accent) focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2"
      >
        Vai al contenuto
      </a>
      <Sidebar theme={theme} onThemeToggle={toggle} onLogoutClick={askLogout} />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader theme={theme} onThemeToggle={toggle} onLogoutClick={askLogout} />

        <main
          id="contenuto-principale"
          key={location.pathname}
          tabIndex={-1}
          className={`flex-1 w-full ${maxW} px-4 py-5 pb-[var(--page-bottom-pad)] sm:py-6 sm:pb-6 sm:px-7 animate-fade-in focus:outline-none`}
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
      <ShortcutsDialog />
      <InstallBanner />

      <ConfirmDialog
        open={confirmLogout}
        title="Esci dall'account?"
        confirmLabel={loggingOut ? "Uscita…" : "Esci"}
        cancelLabel="Annulla"
        busy={loggingOut}
        onConfirm={async () => {
          setLoggingOut(true);
          try {
            await auth.signOut();
          } catch (err) {
            console.error("sign out failed", err);
            notify("Disconnessione non riuscita", "error");
            setLoggingOut(false);
            setConfirmLogout(false);
          }
        }}
        onClose={() => {
          if (loggingOut) return;
          setConfirmLogout(false);
        }}
      />
    </div>
  );
}
