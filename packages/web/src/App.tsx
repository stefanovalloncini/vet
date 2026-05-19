import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import {
  LoginPage,
  EmailLinkCompletePage,
  RequireAuth,
} from "./features/auth";
import { Brand, RouteBoundary, Spinner } from "./shared/ui";

const AziendeListPage = lazy(() =>
  import("./features/aziende").then((m) => ({ default: m.AziendeListPage }))
);
const AziendaFormPage = lazy(() =>
  import("./features/aziende").then((m) => ({ default: m.AziendaFormPage }))
);
const AziendaDetailPage = lazy(() =>
  import("./features/aziende").then((m) => ({ default: m.AziendaDetailPage }))
);
const AttivitaListPage = lazy(() =>
  import("./features/attivita").then((m) => ({ default: m.AttivitaListPage }))
);
const AttivitaFormPage = lazy(() =>
  import("./features/attivita").then((m) => ({ default: m.AttivitaFormPage }))
);
const CestinoPage = lazy(() =>
  import("./features/cestino").then((m) => ({ default: m.CestinoPage }))
);
const ImpostazioniPage = lazy(() =>
  import("./features/cestino").then((m) => ({ default: m.ImpostazioniPage }))
);
const ActivityTypesPage = lazy(() =>
  import("./features/activity-types").then((m) => ({
    default: m.ActivityTypesPage,
  }))
);
const RolesListPage = lazy(() =>
  import("./features/admin-roles").then((m) => ({ default: m.RolesListPage }))
);
const RoleEditorPage = lazy(() =>
  import("./features/admin-roles").then((m) => ({ default: m.RoleEditorPage }))
);
const AllowlistPage = lazy(() =>
  import("./features/admin-allowlist").then((m) => ({
    default: m.AllowlistPage,
  }))
);
const AuditPage = lazy(() =>
  import("./features/admin-audit").then((m) => ({ default: m.AuditPage }))
);
const PaymentsPage = lazy(() =>
  import("./features/payments").then((m) => ({ default: m.PaymentsPage }))
);
const AgendaPage = lazy(() =>
  import("./features/agenda").then((m) => ({ default: m.AgendaPage }))
);
const DashboardPage = lazy(() =>
  import("./features/dashboard").then((m) => ({ default: m.DashboardPage }))
);
const DosaggioPage = lazy(() =>
  import("./features/strumenti").then((m) => ({ default: m.DosaggioPage }))
);
const StrumentiHome = lazy(() =>
  import("./features/strumenti").then((m) => ({ default: m.StrumentiHome }))
);
const RemindersPage = lazy(() =>
  import("./features/reminders").then((m) => ({ default: m.RemindersPage }))
);
const RiepilogoPdfPage = lazy(() =>
  import("./features/riepilogo-pdf").then((m) => ({
    default: m.RiepilogoPdfPage,
  }))
);
const ImportAziendePage = lazy(() =>
  import("./features/import-aziende").then((m) => ({
    default: m.ImportAziendePage,
  }))
);
const VetStatsPage = lazy(() =>
  import("./features/admin-vet-stats").then((m) => ({ default: m.VetStatsPage }))
);
const StatistichePage = lazy(() =>
  import("./features/statistiche").then((m) => ({
    default: m.StatistichePage,
  }))
);
const HomePage = lazy(() =>
  import("./features/home").then((m) => ({ default: m.HomePage }))
);

function RouteFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-(--color-background)">
      <div className="flex flex-col items-center gap-5">
        <Brand size="md" />
        <Spinner size={22} label="Caricamento…" />
      </div>
    </main>
  );
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <RouteBoundary key={location.pathname}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/complete" element={<EmailLinkCompletePage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomePage />
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
          <Route
            path="/aziende/importa"
            element={
              <RequireAuth>
                <ImportAziendePage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/stats-vet"
            element={
              <RequireAuth>
                <VetStatsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/statistiche"
            element={
              <RequireAuth>
                <StatistichePage />
              </RequireAuth>
            }
          />
        </Routes>
      </Suspense>
    </RouteBoundary>
  );
}
