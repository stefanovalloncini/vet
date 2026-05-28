import { Link } from "react-router-dom";
import { LogOut, Moon, Search, Settings, Sun } from "lucide-react";
import { openSearch } from "../../features/search";
import { Brand } from "./Brand";

interface MobileHeaderProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onLogoutClick: () => void;
}

export function MobileHeader({ theme, onThemeToggle, onLogoutClick }: MobileHeaderProps) {
  const ctrl =
    "inline-flex items-center justify-center h-11 w-11 -mx-0.5 rounded-lg text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface-muted) transition-colors duration-(--motion-fast) ease-(--ease-out-quart)";
  return (
    <header className="sm:hidden border-b border-(--color-border) bg-(--color-surface) px-3 h-14 flex items-center justify-between print:hidden">
      <Link to="/" className="inline-flex items-center h-11 px-1 rounded-lg" aria-label="Veterinario · home">
        <Brand size="sm" />
      </Link>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={openSearch}
          aria-label="Cerca"
          aria-keyshortcuts="Meta+K Control+K"
          title="Cerca (⌘K)"
          className={ctrl}
        >
          <Search size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onThemeToggle}
          aria-label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
          className={ctrl}
        >
          {theme === "dark" ? (
            <Sun size={18} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Moon size={18} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
        <Link to="/impostazioni" aria-label="Impostazioni" className={ctrl}>
          <Settings size={18} strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <button type="button" onClick={onLogoutClick} aria-label="Esci" className={ctrl}>
          <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
