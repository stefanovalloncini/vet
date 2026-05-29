import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck } from "lucide-react";
import type { Role } from "@vet/shared";
import {
  AdminLayout,
  Badge,
  EmptyState,
  PageHeader,
} from "../../../shared/ui";
import {
  DataGrid,
  dataGridIt,
  type Column,
} from "../../../shared/ui/data-grid";
import { useRoles } from "../hooks/useRoles";
import { useRoleUserCounts } from "../hooks/useRoleUserCounts";
import { rolesI18n as t } from "../i18n";
import { routes } from "../../../routes";

const EMPTY_ROLES: ReadonlyArray<Role> = [];

function userCountLabel(n: number | null): string {
  if (n === null) return "…";
  if (n === 0) return t.nessunUtente;
  if (n === 1) return t.unUtenteAssegnato;
  return t.utentiAssegnati(n);
}

export function RolesListPage() {
  const rolesQuery = useRoles();
  const roles = rolesQuery.data ?? EMPTY_ROLES;
  const isLoading = rolesQuery.isLoading;
  const isError = rolesQuery.isError;
  const counts = useRoleUserCounts(roles);

  const countById = useMemo(() => {
    const map = new Map<string, number | null>();
    roles.forEach((role, idx) => {
      map.set(role.id, counts[idx]?.count ?? null);
    });
    return map;
  }, [roles, counts]);

  const columns = useMemo<ReadonlyArray<Column<Role>>>(
    () => [
      {
        id: "nome",
        header: t.campoNome,
        accessor: (r) => r.name,
        sortable: true,
      },
    ],
    []
  );

  return (
    <AdminLayout>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <DataGrid<Role>
        rows={roles}
        columns={columns}
        getRowId={(r) => r.id}
        mode="cards"
        i18n={dataGridIt}
        loading={isLoading}
        error={isError ? t.loadError : null}
        rowActions={[]}
        emptyState={<EmptyState title={t.empty} />}
        card={(role) => {
          const count = countById.get(role.id) ?? null;
          return (
            <div className="sm:col-span-2 lg:col-span-3 bg-(--color-surface) border border-(--color-border) rounded-xl sm:rounded-2xl overflow-hidden">
              <Link
                to={routes.adminRoleEdit.to({ id: role.id })}
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
                      <h2 className="text-sm font-medium text-(--color-text) min-w-0 break-words">
                        {role.name}
                      </h2>
                      <span className="text-[11px] text-(--color-text-subtle) font-mono break-all">
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
            </div>
          );
        }}
      />
    </AdminLayout>
  );
}
