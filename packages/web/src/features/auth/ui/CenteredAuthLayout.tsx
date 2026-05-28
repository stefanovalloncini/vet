import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Brand, VersionBadge } from "../../../shared/ui";
import { useTheme } from "../../../shared/theme/useTheme";

interface CenteredAuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function CenteredAuthLayout({
  title,
  subtitle,
  children,
  footer,
}: CenteredAuthLayoutProps) {
  const { theme, toggle } = useTheme();
  return (
    <main
      className="
        relative min-h-[100dvh] flex flex-col bg-(--color-background) text-(--color-text)
        px-6
        pt-[max(2.5rem,env(safe-area-inset-top))]
        pb-[max(1.5rem,env(safe-area-inset-bottom))]
      "
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
        className="
          absolute z-10 inline-flex h-11 w-11 items-center justify-center rounded-full text-(--color-text-muted)
          hover:text-(--color-text) hover:bg-(--color-surface-muted)
          focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2
          transition-colors duration-(--motion-fast) ease-(--ease-out-quart)
          active:scale-[0.97] active:duration-(--motion-press)
          top-[max(0.5rem,env(safe-area-inset-top))] right-2
        "
      >
        {theme === "dark" ? (
          <Sun size={18} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Moon size={18} strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>

      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <div className="w-full max-w-sm space-y-10 animate-fade-in">
          <header className="flex flex-col items-center text-center">
            <Brand size="lg" />
            <h1 className="mt-8 text-xl font-medium text-balance text-(--color-text)">
              {title}
            </h1>
            {subtitle ? (
              <div className="mt-2 text-sm text-(--color-text-muted) text-balance max-w-prose">
                {subtitle}
              </div>
            ) : null}
          </header>

          <div>{children}</div>
        </div>
      </div>

      <div className="mt-10 mx-auto w-full max-w-sm flex flex-col items-center gap-2 text-xs text-(--color-text-subtle) sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className="text-center sm:text-left">{footer ?? null}</span>
        <VersionBadge />
      </div>
    </main>
  );
}
