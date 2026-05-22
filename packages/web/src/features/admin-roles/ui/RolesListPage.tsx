import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  AppShell,
  Button,
  Card,
  InlineError,
  LoadingHint,
  PageHeader,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useRoles } from "../hooks/useRoles";
import { rolesI18n as t } from "../i18n";

export function RolesListPage() {
  const { user } = useAuthState();
  const { roles, loading, error } = useRoles();

  const canManage = user?.caps.has("roles.manage") ?? false;

  return (
    <AppShell>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        {...(canManage
          ? {
              actions: (
                <Link to="/admin/ruoli/nuovo">
                  <Button type="button" variant="primary">
                    {t.nuovoRuolo}
                  </Button>
                </Link>
              ),
            }
          : {})}
      />

      {loading ? (
        <LoadingHint label={t.loading} />
      ) : error ? (
        <InlineError>{t.loadError}</InlineError>
      ) : (
        <ul className="space-y-3">
          {roles.map((role) => (
            <li key={role.id}>
              <Link
                to={`/admin/ruoli/${role.id}`}
                className="block"
              >
                <Card className="hover:border-(--color-border-strong) transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h2 className="text-base font-medium text-(--color-text)">
                          {role.name}
                        </h2>
                        <span className="text-xs text-(--color-text-subtle) font-mono">
                          {role.id}
                        </span>
                        {role.locked ? (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-(--color-surface-muted) text-(--color-text-muted)">
                            locked
                          </span>
                        ) : null}
                      </div>
                      {role.description ? (
                        <p className="text-sm text-(--color-text-muted) mt-1">
                          {role.description}
                        </p>
                      ) : null}
                      <p className="text-xs text-(--color-text-subtle) mt-2">
                        {role.capabilities.length === 0
                          ? t.nessunaCap
                          : `${role.capabilities.length} ${t.capability.toLowerCase()}`}
                      </p>
                    </div>
                    <ChevronRight
                      size={14}
                      strokeWidth={1.75}
                      className="text-(--color-text-subtle) flex-shrink-0 mt-1"
                      aria-hidden="true"
                    />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
