import type { ReactNode } from "react";
import { Brand, VersionBadge } from "../../../shared/ui";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ eyebrow, title, children, footer }: AuthLayoutProps) {
  return (
    <main
      className="
        min-h-[100dvh] flex flex-col bg-(--color-background) text-(--color-text)
        px-6
        pt-[max(2rem,env(safe-area-inset-top))]
        pb-[max(1.5rem,env(safe-area-inset-bottom))]
        lg:grid lg:grid-cols-12 lg:p-0
      "
    >
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

      <section className="flex flex-1 flex-col lg:col-span-7 lg:px-16 lg:py-16">
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
