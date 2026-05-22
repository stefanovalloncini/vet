import { useQuery } from "@tanstack/react-query";
import type { AuditEvent, AuditFilters } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

export const AUDIT_EVENTS_DEFAULT_LIMIT = 200;

export function useAuditEvents(filters: AuditFilters = {}) {
  const { audit } = useRepositories();
  const merged: AuditFilters = { limit: AUDIT_EVENTS_DEFAULT_LIMIT, ...filters };
  return useQuery<AuditEvent[]>({
    queryKey: queryKeys.auditEvents(merged as Record<string, unknown>),
    queryFn: () => audit.list(merged),
  });
}
