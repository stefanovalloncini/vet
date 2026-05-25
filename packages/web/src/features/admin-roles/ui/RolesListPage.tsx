import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck } from "lucide-react";
import {
  AdminLayout,
  Badge,
  BoxedList,
  InlineError,
  LoadingHint,
  PageHeader,
} from "../../../shared/ui";
import { useRoles } from "../hooks/useRoles";
import { useRoleUserCounts } from "../hooks/useRoleUserCounts";
import { rolesI18n as t } from "../i18n";

function userCountLabel(n: number | null): string {
  if (n === null) return "…";
  if (n === 0) return t.nessunUtente;
  if (n === 1) return t.unUtenteAssegnato;
  return t.utentiAssegnati(n);
}

export function RolesListPage() {
  const { data: roles = [], isLoading, isError } = useRoles();
  const counts = useRoleUserCounts(roles);

  return (
    <AdminLayout>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {isLoading ? (
        <LoadingHint label={t.loading} />
      ) : isError ? (
        <InlineError>{t.loadError}</InlineError>
      ) : (
        <BoxedList>
          {roles.map((role, idx) => {
            const count = counts[idx]?.count ?? null;
            return (
              <li key={role.id}>
                <Link
                  to={`/admin/ruoli/${role.id}`}
                  className="block px-4 py-3 hover:bg-(--color-surface-muted) transition-colors duration-(--motion-fast) ease-(--ease-out-quart) focus:outline-none focus-visible:bg-(--color-surface-muted)"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      size={16}
                      strokeWidth={1.75}
                      className="text-(--color-text-subtle) shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h2 className="text-sm font-medium text-(--color-text)">
                          {role.name}
                        </h2>
                        <span className="text-[11px] text-(--color-text-subtle) font-mono">
                          {role.id}
                        </span>
                        {role.locked ? (
                          <Badge tone="neutral">{t.bloccato}</Badge>
                        ) : null}
                      </div>
                      {role.description ? (
                        <p className="text-xs text-(--color-text-muted) mt-0.5 truncate">
                          {role.description}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-(--color-text-subtle) mt-1 tabular-nums">
                        {userCountLabel(count)}
                        <span aria-hidden="true"> · </span>
                        {role.capabilities.length === 0
                          ? t.nessunaCap
                          : `${role.capabilities.length} ${t.capability.toLowerCase()}`}
                      </p>
                    </div>
                    <ChevronRight
                      size={14}
                      strokeWidth={1.75}
                      className="text-(--color-text-subtle) shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </BoxedList>
      )}
    </AdminLayout>
  );
}
