import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import {
  LoginPage,
  EmailLinkCompletePage,
  RequireAuth,
  useAuthState,
} from "./features/auth";
import { AziendeListPage, AziendaFormPage } from "./features/aziende";
import { AttivitaListPage, AttivitaFormPage } from "./features/attivita";
import { ActivityTypesPage } from "./features/activity-types";
import { AppShell, Card } from "./shared/ui";

function Home() {
  const { user } = useAuthState();
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  if (user?.caps.has("activities.read.all")) {
    return <Navigate to="/attivita" replace />;
  }

  const tiles = [
    {
      to: "/aziende",
      title: "Aziende",
      hint: "Gestisci anagrafica clienti",
      cap: "aziende.read",
    },
    {
      to: "/admin/tipi-attivita",
      title: "Tipi di attività",
      hint: "Visite, vaccinazioni, ginecologia, ...",
      cap: "activity_types.read",
    },
  ];

  const visible = tiles.filter((tile) => user?.caps.has(tile.cap as never));

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-medium tracking-tight text-(--color-text)">
          Ciao {firstName}
        </h1>
        <p className="text-(--color-text-muted) mt-3 text-base">
          Da qui puoi gestire i tuoi clienti.
        </p>

        {visible.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/complete" element={<EmailLinkCompletePage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/attivita"
          element={
            <RequireAuth>
              <AttivitaListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/attivita/nuova"
          element={
            <RequireAuth>
              <AttivitaFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/attivita/:id"
          element={
            <RequireAuth>
              <AttivitaFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/aziende"
          element={
            <RequireAuth>
              <AziendeListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/aziende/nuova"
          element={
            <RequireAuth>
              <AziendaFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/aziende/:id"
          element={
            <RequireAuth>
              <AziendaFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/tipi-attivita"
          element={
            <RequireAuth>
              <ActivityTypesPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
