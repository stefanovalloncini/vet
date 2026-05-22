import { QueryClient } from "@tanstack/react-query";

export const DEFAULT_STALE_TIME_MS = 30_000;
export const DEFAULT_GC_TIME_MS = 300_000;

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
  });
}

export const queryKeys = {
  aziende: ["aziende"] as const,
  azienda: (id: string) => ["aziende", id] as const,
  attivita: (filters?: Readonly<Record<string, unknown>>) =>
    ["attivita", filters ?? {}] as const,
  attivitaById: (id: string) => ["attivita", "id", id] as const,
  tipiAttivita: ["tipiAttivita"] as const,
  payments: (filters?: Readonly<Record<string, unknown>>) =>
    ["payments", filters ?? {}] as const,
  vetStats: (filters?: Readonly<Record<string, unknown>>) =>
    ["vetStats", filters ?? {}] as const,
  auditEvents: (filters?: Readonly<Record<string, unknown>>) =>
    ["auditEvents", filters ?? {}] as const,
  allowlist: ["allowlist"] as const,
  pendingUsers: ["pendingUsers"] as const,
  roles: ["roles"] as const,
  role: (id: string) => ["roles", id] as const,
} as const;
