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
const ContiPage = lazy(() =>
  import("./features/conti").then((m) => ({ default: m.ContiPage }))
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

import { routes } from "./routes";

export { routes };

export const PROTECTED_ROUTES: ReadonlyArray<AppRoute> = [
  { path: routes.home.path, Component: HomePage },
  { path: routes.attivita.path, Component: AttivitaListPage },
  { path: routes.attivitaNew.path, Component: AttivitaFormPage },
  { path: routes.attivitaEdit.path, Component: AttivitaFormPage },
  { path: routes.aziende.path, Component: AziendeListPage },
  { path: routes.aziendaNew.path, Component: AziendaFormPage },
  { path: routes.aziendaDetail.path, Component: AziendaDetailPage },
  { path: routes.aziendaEdit.path, Component: AziendaFormPage },
  { path: routes.aziendaRiepilogo.path, Component: RiepilogoPdfPage },
  { path: routes.cestino.path, Component: CestinoPage },
  { path: routes.impostazioni.path, Component: ImpostazioniPage },
  { path: routes.adminTipiAttivita.path, Component: ActivityTypesPage },
  { path: routes.adminRoles.path, Component: RolesListPage },
  { path: routes.adminRoleNew.path, Component: RoleEditorPage },
  { path: routes.adminRoleEdit.path, Component: RoleEditorPage },
  { path: routes.adminAllowlist.path, Component: AllowlistPage },
  { path: routes.adminAudit.path, Component: AuditPage },
  { path: routes.adminStatsVet.path, Component: VetStatsPage },
  { path: routes.conti.path, Component: ContiPage },
  { path: routes.agenda.path, Component: AgendaPage },
  { path: routes.riepilogo.path, Component: DashboardPage },
  { path: routes.strumenti.path, Component: StrumentiHome },
  { path: routes.strumentiDosaggio.path, Component: DosaggioPage },
  { path: routes.promemoria.path, Component: RemindersPage },
  { path: routes.statistiche.path, Component: StatistichePage },
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
