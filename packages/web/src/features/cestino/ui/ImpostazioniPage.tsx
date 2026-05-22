import { useState } from "react";
import {
  AppShell,
  Button,
  Card,
  ConfirmDialog,
  InlineError,
  PageHeader,
  SectionLabel,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { impostazioniI18n as t } from "../i18n";

export function ImpostazioniPage() {
  const { user } = useAuthState();
  const { trash, auth, aziende, attivita, payments, reminders } = useRepositories();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const calls = [
        { name: "aziende", run: () => aziende.list() },
        { name: "attivita", run: () => attivita.list() },
        { name: "payments", run: () => payments.list() },
        { name: "reminders", run: () => reminders.list() },
      ] as const;
      const results = await Promise.all(
        calls.map(async (c) => {
          try {
            return { name: c.name, ok: true as const, value: await c.run() };
          } catch (e) {
            return { name: c.name, ok: false as const, err: e };
          }
        })
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        const detail = failed
          .map((f) => `${f.name}: ${f.err instanceof Error ? f.err.message : String(f.err)}`)
          .join("; ");
        console.error("export failed", failed);
        setError(`Export non riuscito (${detail})`);
        setExporting(false);
        return;
      }
      const az = (results[0] as { ok: true; value: Awaited<ReturnType<typeof aziende.list>> }).value;
      const at = (results[1] as { ok: true; value: Awaited<ReturnType<typeof attivita.list>> }).value;
      const pa = (results[2] as { ok: true; value: Awaited<ReturnType<typeof payments.list>> }).value;
      const re = (results[3] as { ok: true; value: Awaited<ReturnType<typeof reminders.list>> }).value;
      const payload = {
        exportedAt: new Date().toISOString(),
        exportedBy: user?.email ?? "",
        version: 1,
        aziende: az,
        attivita: at,
        payments: pa,
        reminders: re,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vet-app-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Export non riuscito: ${msg}`);
      console.error("export failed", err);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await trash.gdprDeleteMine();
      setDone(true);
      setTimeout(() => {
        void auth.signOut();
      }, 1500);
    } catch {
      setError(t.gdprErrore);
      setBusy(false);
    }
  }

  function renderGdprAction() {
    if (done) {
      return <p className="text-sm text-(--color-text) mt-5">{t.gdprDone}</p>;
    }
    if (busy) {
      return <p className="text-sm text-(--color-text-muted) mt-5">{t.gdprBusy}</p>;
    }
    return (
      <div className="mt-5">
        <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
          {t.gdprButton}
        </Button>
      </div>
    );
  }

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="max-w-2xl">
        <Card>
          <SectionLabel className="mb-3">Profilo</SectionLabel>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-(--color-text-subtle) text-xs mb-1">Nome</dt>
              <dd className="text-(--color-text)">{user?.displayName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-(--color-text-subtle) text-xs mb-1">Email</dt>
              <dd className="text-(--color-text)">{user?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-(--color-text-subtle) text-xs mb-1">Ruolo</dt>
              <dd className="text-(--color-text)">{user?.roleId || "—"}</dd>
            </div>
          </dl>
        </Card>

        <SectionLabel className="mt-10 mb-3">Dati</SectionLabel>
        <Card>
          <h2 className="text-base font-medium text-(--color-text)">
            Esporta i tuoi dati
          </h2>
          <p className="text-sm text-(--color-text-muted) mt-2 max-w-prose">
            Scarica un backup JSON di aziende, attività, pagamenti e promemoria.
          </p>
          <div className="mt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Esportazione…" : "Scarica backup JSON"}
            </Button>
          </div>
        </Card>

        <SectionLabel className="mt-10 mb-3">{t.gdprSection}</SectionLabel>
        <Card>
          <h2 className="text-base font-medium text-(--color-text)">
            {t.gdprTitle}
          </h2>
          <p className="text-sm text-(--color-text-muted) mt-2 max-w-prose">
            {t.gdprDescr}
          </p>

          {renderGdprAction()}

          {error ? <InlineError className="mt-3">{error}</InlineError> : null}
        </Card>
      </div>

      <ConfirmDialog
        open={confirming}
        title={t.gdprConfermaTitolo}
        message={t.gdprConferma}
        confirmLabel={t.gdprButton}
        cancelLabel={t.gdprAnnulla}
        variant="danger"
        busy={busy}
        onConfirm={() => {
          setConfirming(false);
          void handleDelete();
        }}
        onClose={() => setConfirming(false)}
      />
    </AppShell>
  );
}
