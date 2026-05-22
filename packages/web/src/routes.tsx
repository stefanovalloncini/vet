import {
  Suspense,
  lazy,
  type LazyExoticComponent,
  type ComponentType,
  type ReactNode,
} from "react";
import { Brand, RouteBoundary, Spinner } from "./shared/ui";

type LazyComp = LazyExoticComponent<ComponentType>;

const HomePage = lazy(() =>
  import("./features/home").then((m) => ({ default: m.HomePage }))
);
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
  import("./features/statistiche").then((m) => ({ default: m.StatistichePage }))
);

export interface AppRoute {
  path: string;
  Component: LazyComp;
}

export const PROTECTED_ROUTES: ReadonlyArray<AppRoute> = [
  { path: "/", Component: HomePage },
  { path: "/attivita", Component: AttivitaListPage },
  { path: "/attivita/nuova", Component: AttivitaFormPage },
  { path: "/attivita/:id", Component: AttivitaFormPage },
  { path: "/aziende", Component: AziendeListPage },
  { path: "/aziende/nuova", Component: AziendaFormPage },
  { path: "/aziende/:id", Component: AziendaDetailPage },
  { path: "/aziende/:id/modifica", Component: AziendaFormPage },
  { path: "/aziende/:id/riepilogo", Component: RiepilogoPdfPage },
  { path: "/aziende/importa", Component: ImportAziendePage },
  { path: "/cestino", Component: CestinoPage },
  { path: "/impostazioni", Component: ImpostazioniPage },
  { path: "/admin/tipi-attivita", Component: ActivityTypesPage },
  { path: "/admin/ruoli", Component: RolesListPage },
  { path: "/admin/ruoli/nuovo", Component: RoleEditorPage },
  { path: "/admin/ruoli/:id", Component: RoleEditorPage },
  { path: "/admin/allowlist", Component: AllowlistPage },
  { path: "/admin/audit", Component: AuditPage },
  { path: "/admin/stats-vet", Component: VetStatsPage },
  { path: "/pagamenti", Component: PaymentsPage },
  { path: "/agenda", Component: AgendaPage },
  { path: "/riepilogo", Component: DashboardPage },
  { path: "/strumenti", Component: StrumentiHome },
  { path: "/strumenti/dosaggio", Component: DosaggioPage },
  { path: "/promemoria", Component: RemindersPage },
  { path: "/statistiche", Component: StatistichePage },
];

interface RouteShellProps {
  pathname: string;
  children: ReactNode;
}

export function RouteShell({ pathname, children }: RouteShellProps) {
  return (
    <RouteBoundary resetKeys={[pathname]}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </RouteBoundary>
  );
}

interface RouteFallbackProps {
  label?: string;
}

export function RouteFallback({ label = "Caricamento…" }: RouteFallbackProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-(--color-background)">
      <div className="flex flex-col items-center gap-5">
        <Brand size="md" />
        <Spinner size={22} label={label} />
      </div>
    </main>
  );
}
