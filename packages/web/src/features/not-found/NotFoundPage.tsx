import { Link, useLocation } from "react-router-dom";
import { AppShell, Button, PageHeader } from "../../shared/ui";
import { useAuthState } from "../auth";

export function NotFoundPage() {
  const { user } = useAuthState();
  const { pathname } = useLocation();
  const home = user ? "/" : "/login";

  if (!user) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-(--color-background) p-6">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="text-2xl font-medium text-(--color-text)">Pagina non trovata</h1>
          <p className="text-sm text-(--color-text-muted)">
            Il link <code className="font-mono text-xs">{pathname}</code> non esiste.
          </p>
          <Link to={home}>
            <Button type="button" variant="primary">
              Torna al login
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Pagina non trovata" subtitle="Questo indirizzo non corrisponde a nessuna sezione." />
      <div className="max-w-md space-y-3">
        <p className="text-sm text-(--color-text-muted)">
          Hai aperto <code className="font-mono text-xs text-(--color-text)">{pathname}</code>, ma non c&apos;è una pagina qui.
        </p>
        <Link to={home}>
          <Button type="button" variant="primary">
            Torna al riepilogo
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}
