import { Badge, Button } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../hooks/useAuthState";
import { CenteredAuthLayout } from "./CenteredAuthLayout";

export function PendingApproval() {
  const { user } = useAuthState();
  const { auth } = useRepositories();
  return (
    <CenteredAuthLayout title="Account in attesa di approvazione">
      <div className="space-y-6">
        <dl className="space-y-3 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-(--color-text-muted)">
              Identità
            </dt>
            <dd className="min-w-0 font-mono text-(--color-text) break-all sm:text-right">
              {user?.email ?? "—"}
            </dd>
          </div>
          <hr className="border-(--color-border)" />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-(--color-text-muted)">
              Stato
            </dt>
            <dd>
              <Badge tone="warning" dot>
                In coda
              </Badge>
            </dd>
          </div>
        </dl>

        <p className="text-sm text-(--color-text-muted)">
          Lo studio è stato notificato. Ti scriviamo non appena l&apos;account
          viene abilitato; al prossimo accesso entri direttamente.
        </p>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => void auth.signOut()}
        >
          Esci
        </Button>
      </div>
    </CenteredAuthLayout>
  );
}
