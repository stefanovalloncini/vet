import { Link, Navigate } from "react-router-dom";
import { useAuthState } from "../auth";
import { AppShell, Card, CardSkeleton, EmptyState } from "../../shared/ui";
import type { Capability } from "@vet/shared";

interface Tile {
  to: string;
  title: string;
  hint: string;
  cap: Capability;
}

const TILES: Tile[] = [
  {
    to: "/aziende",
    title: "Aziende",
    hint: "Anagrafica clienti",
    cap: "aziende.read",
  },
  {
    to: "/admin/tipi-attivita",
    title: "Tipi attività",
    hint: "Visite, vaccinazioni, ginecologia",
    cap: "activity_types.read",
  },
  {
    to: "/admin/ruoli",
    title: "Ruoli",
    hint: "Capacità per ruolo",
    cap: "roles.read",
  },
  {
    to: "/admin/allowlist",
    title: "Allowlist",
    hint: "Email autorizzate",
    cap: "allowlist.read",
  },
  {
    to: "/admin/audit",
    title: "Audit",
    hint: "Eventi server",
    cap: "audit.read",
  },
];

export function HomePage() {
  const { loading, user } = useAuthState();

  if (loading) return <HomeLoadingState />;

  if (user?.caps.has("activities.read.all")) {
    return <Navigate to="/riepilogo" replace />;
  }

  const visible = TILES.filter((tile) => user?.caps.has(tile.cap));

  return (
    <AppShell>
      <div className="max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-medium text-(--color-text)">
            Pannello di controllo
          </h1>
          <p className="text-(--color-text-muted) mt-1 text-sm">
            Aree disponibili in base al tuo profilo.
          </p>
        </header>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visible.map((tile) => (
              <Link
                key={tile.to}
                to={tile.to}
                className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
              >
                <Card className="h-full transition-colors group-hover:border-(--color-border-strong)">
                  <h2 className="text-base font-medium text-(--color-text)">
                    {tile.title}
                  </h2>
                  <p className="text-sm text-(--color-text-muted) mt-1">
                    {tile.hint}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nessuna area disponibile"
            description="Il profilo non ha sezioni assegnate. Contatta l'amministratore."
          />
        )}
      </div>
    </AppShell>
  );
}

function HomeLoadingState() {
  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <CardSkeleton rows={2} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CardSkeleton rows={1} />
          <CardSkeleton rows={1} />
        </div>
      </div>
    </AppShell>
  );
}
