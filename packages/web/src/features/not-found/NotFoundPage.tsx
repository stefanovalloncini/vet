import { Link, useLocation } from "react-router-dom";
import { AppShell, Brand, PageHeader } from "../../shared/ui";
import { useAuthState } from "../auth";

const primaryLink =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-(--color-accent) px-4 text-sm font-medium text-white hover:bg-(--color-accent-hover) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 transition-colors duration-(--motion-fast) ease-(--ease-out-quart) active:scale-[0.97] active:duration-(--motion-press)";

export function NotFoundPage() {
  const { user } = useAuthState();
  const { pathname } = useLocation();

  if (!user) {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-(--color-background) px-6 py-12 text-center">
        <Brand size="lg" />
        <div className="mt-8 w-full max-w-sm space-y-3">
          <h1 className="text-2xl font-medium text-(--color-text)">
            Pagina non trovata
          </h1>
          <p className="text-sm text-(--color-text-muted)">
            Il link{" "}
            <code className="font-mono text-xs break-all text-(--color-text)">
              {pathname}
            </code>{" "}
            non esiste.
          </p>
          <div className="pt-1">
            <Link to="/login" className={primaryLink}>
              Torna al login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Pagina non trovata"
        subtitle="Questo indirizzo non corrisponde a nessuna sezione."
      />
      <div className="max-w-md space-y-4">
        <p className="text-sm text-(--color-text-muted)">
          Hai aperto{" "}
          <code className="font-mono text-xs break-all text-(--color-text)">
            {pathname}
          </code>
          , ma non c&apos;è una pagina qui.
        </p>
        <Link to="/" className={primaryLink}>
          Torna al riepilogo
        </Link>
      </div>
    </AppShell>
  );
}
