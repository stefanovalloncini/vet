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
    <main className="min-h-screen bg-(--color-background) text-(--color-text) lg:grid lg:grid-cols-12">
      <aside className="bg-(--color-accent-soft) px-6 pt-10 pb-12 sm:px-10 lg:col-span-5 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14 lg:min-h-screen">
        <Brand size="lg" />

        <p className="hidden lg:block max-w-sm mt-10 text-base leading-relaxed text-(--color-text)">
          Registro attività dello studio. Visite, ore, tariffe e totali per azienda.
          <span className="block mt-3 text-sm text-(--color-text-muted)">
            Accesso solo nominale, dati conservati in Italia, esportazione CSV su richiesta.
          </span>
        </p>

        <div className="hidden lg:block">
          <VersionBadge />
        </div>
      </aside>

      <section className="px-6 pt-12 pb-16 sm:px-10 lg:col-span-7 lg:flex lg:flex-col lg:justify-center lg:px-16 lg:py-16">
        <div className="w-full max-w-sm lg:mx-0 mx-auto">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-(--color-text-muted)">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-xl font-medium text-(--color-text)">
            {title}
          </h1>
          <hr className="mt-6 mb-8 border-(--color-border)" />
          {children}
          {footer ? (
            <>
              <hr className="mt-10 mb-4 border-(--color-border)" />
              <div className="text-xs text-(--color-text-subtle)">{footer}</div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
