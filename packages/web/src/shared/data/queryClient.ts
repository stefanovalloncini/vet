import { MutationCache, QueryClient } from "@tanstack/react-query";

export const DEFAULT_STALE_TIME_MS = 30_000;
export const DEFAULT_GC_TIME_MS = 300_000;

type ToastFn = (message: string, kind: "error") => void;

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: { silent?: boolean; errorMessage?: string };
  }
}

let registeredNotifier: ToastFn | null = null;

export function registerMutationErrorNotifier(fn: ToastFn | null): void {
  registeredNotifier = fn;
}

function defaultErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Operazione non riuscita. Riprova.";
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: DEFAULT_GC_TIME_MS,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const meta = (mutation.meta ?? {}) as {
          silent?: boolean;
          errorMessage?: string;
        };
        if (meta.silent) return;
        const msg = meta.errorMessage ?? defaultErrorMessage(error);
        registeredNotifier?.(msg, "error");
      },
    }),
  });
}

export const queryKeys = {
  aziende: ["aziende"] as const,
  azienda: (id: string) => ["aziende", id] as const,
  aziendaDetail: (id: string) => ["aziende", id, "detail"] as const,
  attivita: (filters?: Readonly<Record<string, unknown>>) =>
    ["attivita", filters ?? {}] as const,
  attivitaById: (id: string | undefined) =>
    ["attivita", "byId", id ?? null] as const,
  attivitaLastByAziendaAndTipo: (
    aziendaId: string | undefined,
    tipoId: string | undefined
  ) =>
    [
      "attivita",
      "lastByAziendaTipo",
      aziendaId ?? null,
      tipoId ?? null,
    ] as const,
  tipiAttivita: ["tipiAttivita"] as const,
  reminders: (filters?: Readonly<Record<string, unknown>>) =>
    ["reminders", filters ?? {}] as const,
  vetStats: (filters?: Readonly<Record<string, unknown>>) =>
    ["vetStats", filters ?? {}] as const,
  auditEvents: (filters?: Readonly<Record<string, unknown>>) =>
    ["auditEvents", filters ?? {}] as const,
  allowlist: ["allowlist"] as const,
  pendingUsers: ["pendingUsers"] as const,
  accessRequests: ["accessRequests"] as const,
  roles: ["roles"] as const,
  role: (id: string) => ["roles", id] as const,
  dashboardStats: (filters?: Readonly<Record<string, unknown>>) =>
    ["dashboardStats", filters ?? {}] as const,
  statistiche: (filters?: Readonly<Record<string, unknown>>) =>
    ["statistiche", filters ?? {}] as const,
  riepilogoPdf: (
    aziendaId: string,
    from: string | null,
    to: string | null
  ) => ["riepilogoPdf", aziendaId, from, to] as const,
  agenda: (dateRange?: Readonly<Record<string, unknown>>) =>
    ["agenda", dateRange ?? {}] as const,
  trash: (filters?: Readonly<Record<string, unknown>>) =>
    ["trash", filters ?? {}] as const,
} as const;

export const ATTIVITA_DEPENDENT_KEYS = [
  ["attivita"],
  ["agenda"],
  ["vetStats"],
  ["dashboardStats"],
  ["statistiche"],
  ["trash"],
] as const;

export const AZIENDE_DEPENDENT_KEYS = [
  ["aziende"],
] as const;

export const REMINDERS_DEPENDENT_KEYS = [
  ["reminders"],
] as const;

export function invalidateMany(
  qc: { invalidateQueries: (input: { queryKey: readonly unknown[] }) => Promise<unknown> | void },
  keys: ReadonlyArray<readonly unknown[]>
): void {
  for (const key of keys) {
    void qc.invalidateQueries({ queryKey: key });
  }
}

export interface FilterKeyInput {
  from?: Date | undefined;
  to?: Date | undefined;
  aziendaId?: string | undefined;
  tipoId?: string | undefined;
  ownerUid?: string | undefined;
}

export function filterKey(
  filters: FilterKeyInput | undefined
): Record<string, unknown> {
  if (!filters) return {};
  return {
    from: filters.from?.toISOString(),
    to: filters.to?.toISOString(),
    aziendaId: filters.aziendaId,
    tipoId: filters.tipoId,
    ownerUid: filters.ownerUid,
  };
}
