import { Link, Navigate } from "react-router-dom";
import { useAuthState } from "../auth";
import { AppShell, Card } from "../../shared/ui";

interface Tile {
  to: string;
  title: string;
  hint: string;
  cap: string;
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
  const { user } = useAuthState();

  if (user?.caps.has("activities.read.all")) {
    return <Navigate to="/riepilogo" replace />;
  }

  const visible = TILES.filter((tile) => user?.caps.has(tile.cap as never));

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-medium text-(--color-text)">
          Pannello di controllo
        </h1>
        <p className="text-(--color-text-muted) mt-2 text-sm">
          Aree disponibili in base al tuo profilo.
        </p>

        {visible.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visible.map((tile) => (
              <Link key={tile.to} to={tile.to} className="block">
                <Card className="h-full hover:border-(--color-border-strong) transition-colors">
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
        ) : null}
      </div>
    </AppShell>
  );
}
