import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import {
  LoginPage,
  EmailLinkCompletePage,
  RequireAuth,
  useAuthState,
} from "./features/auth";
import {
  AziendeListPage,
  AziendaFormPage,
  AziendaDetailPage,
} from "./features/aziende";
import { AttivitaListPage, AttivitaFormPage } from "./features/attivita";
import { CestinoPage, ImpostazioniPage } from "./features/cestino";
import { ActivityTypesPage } from "./features/activity-types";
import { RolesListPage, RoleEditorPage } from "./features/admin-roles";
import { AllowlistPage } from "./features/admin-allowlist";
import { AuditPage } from "./features/admin-audit";
import { PaymentsPage } from "./features/payments";
import { AgendaPage } from "./features/agenda";
import { DashboardPage } from "./features/dashboard";
import { DosaggioPage, StrumentiHome } from "./features/strumenti";
import { RemindersPage } from "./features/reminders";
import { RiepilogoPdfPage } from "./features/riepilogo-pdf";
import { AppShell, Card } from "./shared/ui";

function Home() {
  const { user } = useAuthState();
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  if (user?.caps.has("activities.read.all")) {
    return <Navigate to="/riepilogo" replace />;
  }

  const tiles = [
    {
      to: "/aziende",
      title: "Aziende",
      hint: "Allevamenti e clienti",
      cap: "aziende.read",
    },
    {
      to: "/admin/tipi-attivita",
      title: "Tipi di attività",
      hint: "Visite, vaccinazioni, ginecologia, ...",
      cap: "activity_types.read",
    },
    {
      to: "/admin/ruoli",
      title: "Ruoli",
      hint: "Permessi e capacità",
      cap: "roles.read",
    },
    {
      to: "/admin/allowlist",
      title: "Allowlist",
      hint: "Chi può entrare",
      cap: "allowlist.read",
    },
    {
      to: "/admin/audit",
      title: "Audit",
      hint: "Eventi server",
      cap: "audit.read",
    },
  ];

  const visible = tiles.filter((tile) => user?.caps.has(tile.cap as never));

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl text-(--color-text)">Ciao {firstName}</h1>
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
              <AziendaDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/aziende/:id/modifica"
          element={
            <RequireAuth>
              <AziendaFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/cestino"
          element={
            <RequireAuth>
              <CestinoPage />
            </RequireAuth>
          }
        />
        <Route
          path="/impostazioni"
          element={
            <RequireAuth>
              <ImpostazioniPage />
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
        <Route
          path="/admin/ruoli"
          element={
            <RequireAuth>
              <RolesListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/ruoli/nuovo"
          element={
            <RequireAuth>
              <RoleEditorPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/ruoli/:id"
          element={
            <RequireAuth>
              <RoleEditorPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/allowlist"
          element={
            <RequireAuth>
              <AllowlistPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <RequireAuth>
              <AuditPage />
            </RequireAuth>
          }
        />
        <Route
          path="/pagamenti"
          element={
            <RequireAuth>
              <PaymentsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/agenda"
          element={
            <RequireAuth>
              <AgendaPage />
            </RequireAuth>
          }
        />
        <Route
          path="/riepilogo"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/strumenti"
          element={
            <RequireAuth>
              <StrumentiHome />
            </RequireAuth>
          }
        />
        <Route
          path="/strumenti/dosaggio"
          element={
            <RequireAuth>
              <DosaggioPage />
            </RequireAuth>
          }
        />
        <Route
          path="/promemoria"
          element={
            <RequireAuth>
              <RemindersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/aziende/:id/riepilogo"
          element={
            <RequireAuth>
              <RiepilogoPdfPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
