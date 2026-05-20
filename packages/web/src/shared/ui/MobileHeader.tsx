import { Link } from "react-router-dom";
import { LogOut, Moon, Settings, Sun } from "lucide-react";
import { Brand } from "./Brand";

interface MobileHeaderProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onLogoutClick: () => void;
}

export function MobileHeader({ theme, onThemeToggle, onLogoutClick }: MobileHeaderProps) {
  return (
    <header className="sm:hidden border-b border-(--color-border) bg-(--color-surface) px-4 h-12 flex items-center justify-between">
      <Link to="/" className="inline-flex">
        <Brand size="sm" />
      </Link>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onThemeToggle}
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
          onClick={onLogoutClick}
          aria-label="Esci"
          className="p-2 text-(--color-text-muted) hover:text-(--color-text) transition-colors"
        >
          <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
