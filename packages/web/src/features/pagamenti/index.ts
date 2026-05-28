export { PagamentiPage } from "./ui/PagamentiPage";
export { StatoBadge } from "./ui/StatoBadge";
export type { StatoBadgeProps, StatoBadgeStatus } from "./ui/StatoBadge";
export {
  usePagamentiOverview,
  type PagamentoOverview,
  type UsePagamentiOverviewResult,
} from "./hooks/usePagamentiOverview";
export { defaultPeriodForAzienda } from "./lib/contoPeriodPolicy";
export { statoFor, statoForKey } from "./lib/status";
export type { StatoKey, StatoMeta } from "./lib/status";
