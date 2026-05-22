import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Brand, VersionBadge } from "../../../shared/ui";
import { useTheme } from "../../../shared/theme/useTheme";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ eyebrow, title, children, footer }: AuthLayoutProps) {
  const { theme, toggle } = useTheme();
  return (
    <main
      className="
        relative min-h-[100dvh] flex flex-col bg-(--color-background) text-(--color-text)
        px-6
        pt-[max(2rem,env(safe-area-inset-top))]
        pb-[max(1.5rem,env(safe-area-inset-bottom))]
        lg:grid lg:grid-cols-12 lg:p-0
      "
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
        className="
          absolute z-10 p-2 rounded-full text-(--color-text-muted)
          hover:text-(--color-text) hover:bg-(--color-surface-muted)
          transition-colors duration-(--motion-fast) ease-(--ease-out-quart)
          top-[max(1rem,env(safe-area-inset-top))] right-4
          lg:top-6 lg:right-6
        "
      >
        {theme === "dark" ? (
          <Sun size={18} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Moon size={18} strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
      <aside
        className="
          hidden bg-(--color-accent-soft) lg:col-span-5 lg:flex lg:flex-col
          lg:px-12 lg:py-14 lg:min-h-screen
        "
      >
        <Brand size="lg" />
        <div className="hidden lg:block mt-auto">
          <VersionBadge />
        </div>
      </aside>

      <section className="flex flex-1 flex-col lg:col-span-7 lg:px-16 lg:py-16 lg:justify-center">
        <div className="flex flex-1 flex-col justify-center w-full max-w-sm mx-auto lg:mx-0 lg:flex-none lg:justify-start">
          <Brand size="md" className="lg:hidden mb-8" />
          <p className="hidden lg:block text-[11px] font-medium uppercase tracking-[0.22em] text-(--color-text-muted)">
            {eyebrow}
          </p>
          <h1 className="text-xl font-medium text-(--color-text) lg:mt-2">
            {title}
          </h1>
          <hr className="hidden lg:block mt-6 mb-8 border-(--color-border)" />
          <div className="mt-8 lg:mt-0">{children}</div>
        </div>
        {footer ? (
          <div className="text-xs text-(--color-text-subtle) mt-8 max-w-sm mx-auto lg:mx-0 lg:mt-10 lg:pt-4 lg:border-t lg:border-(--color-border)">
            {footer}
          </div>
        ) : null}
      </section>
    </main>
  );
}
