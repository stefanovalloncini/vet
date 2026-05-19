import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  LoginPage,
  EmailLinkCompletePage,
  RequireAuth,
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
import { ImportAziendePage } from "./features/import-aziende";
import { VetStatsPage } from "./features/admin-vet-stats";
import { StatistichePage } from "./features/statistiche";
import { HomePage } from "./features/home";

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
    </BrowserRouter>
  );
}
