import { Button } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../hooks/useAuthState";
import { AuthLayout } from "./AuthLayout";

export function PendingApproval() {
  const { user } = useAuthState();
  const { auth } = useRepositories();
  return (
    <AuthLayout eyebrow="Accesso · in coda" title="Account in attesa di approvazione">
      <dl className="space-y-3 text-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <dt className="text-[11px] uppercase tracking-[0.18em] text-(--color-text-muted)">
            Identità
          </dt>
          <dd className="font-mono text-(--color-text) break-all">
            {user?.email ?? "—"}
          </dd>
        </div>
        <hr className="border-(--color-border)" />
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <dt className="text-[11px] uppercase tracking-[0.18em] text-(--color-text-muted)">
            Stato
          </dt>
          <dd className="text-(--color-text)">In coda</dd>
        </div>
      </dl>

      <p className="mt-8 text-sm text-(--color-text)">
        Lo studio è stato notificato. Ti scriviamo non appena l&apos;account viene
        abilitato; al prossimo accesso entri direttamente.
      </p>

      <div className="mt-8">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void auth.signOut()}
        >
          Esci
        </Button>
      </div>
    </AuthLayout>
  );
}
