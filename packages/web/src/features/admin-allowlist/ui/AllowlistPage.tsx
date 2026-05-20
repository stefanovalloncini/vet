import { useState, type FormEvent } from "react";
import {
  AppShell,
  Button,
  Card,
  ConfirmDialog,
  Select,
  TextField,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useAllowlist } from "../hooks/useAllowlist";
import { allowlistI18n as t } from "../i18n";
import {
  allowlistEntryInputSchema,
  type AllowlistEntry,
} from "@vet/shared";

export function AllowlistPage() {
  const { user } = useAuthState();
  const { allowlist } = useRepositories();
  const { entries, roles, loading, error, refresh } = useAllowlist();

  const canManage = user?.caps.has("allowlist.manage") ?? false;

  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("vet");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!user || !canManage) return;
    const notesTrim = notes.trim();
    const parsed = allowlistEntryInputSchema.safeParse({
      email: email.trim(),
      defaultRoleId: roleId,
      ...(notesTrim ? { notes: notesTrim } : {}),
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? t.saveError);
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      await allowlist.add(parsed.data, user.uid);
      setEmail("");
      setNotes("");
      setRoleId("vet");
      setAdding(false);
      await refresh();
    } catch {
      setErrorMsg(t.saveError);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(entry: AllowlistEntry) {
    if (!canManage) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      await allowlist.remove(entry.email);
      setConfirmingRemove(null);
      await refresh();
    } catch {
      setErrorMsg(t.saveError);
    } finally {
      setBusy(false);
    }
  }

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <AppShell>
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl text-(--color-text)">{t.title}</h1>
          <p className="text-(--color-text-muted) mt-2 text-sm">{t.subtitle}</p>
        </div>
        {canManage && !adding ? (
          <Button
            type="button"
            variant="primary"
            onClick={() => setAdding(true)}
          >
            {t.aggiungi}
          </Button>
        ) : null}
      </header>

      {errorMsg ? (
        <p role="alert" className="text-sm text-(--color-danger) mb-4">
          {errorMsg}
        </p>
      ) : null}

      {adding ? (
        <Card className="mb-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <TextField
              id="allow-email"
              type="email"
              label={t.campoEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.campoEmailPlaceholder}
              required
              autoFocus
              disabled={busy}
            />
            <Select
              id="allow-role"
              label={t.campoRuolo}
              value={roleId}
              options={roleOptions}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={busy}
            />
            <TextField
              id="allow-notes"
              label={t.campoNote}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={busy}
              maxLength={500}
            />
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setErrorMsg(null);
                }}
                disabled={busy}
              >
                {t.annulla}
              </Button>
              <Button type="submit" variant="primary" disabled={busy}>
                {t.aggiungi}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-(--color-danger)">{t.loadError}</p>
      ) : entries.length === 0 ? (
        <Card>
          <p className="text-sm text-(--color-text-muted) text-center py-4">
            {t.empty}
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.emailNorm}>
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-(--color-text) truncate">
                      {entry.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-(--color-surface-muted) text-(--color-text-muted)">
                        {roles.find((r) => r.id === entry.defaultRoleId)?.name ??
                          entry.defaultRoleId}
                      </span>
                      <span className="text-xs text-(--color-text-subtle)">
                        {t.invitedAt} {entry.invitedAt.toLocaleDateString("it-IT")}{" "}
                        {t.invitedBy} {entry.invitedBy}
                      </span>
                    </div>
                    {entry.notes ? (
                      <p className="text-xs text-(--color-text-muted) mt-2">
                        {entry.notes}
                      </p>
                    ) : null}
                  </div>
                  {canManage ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingRemove(entry.emailNorm)}
                      disabled={busy}
                    >
                      {t.elimina}
                    </Button>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmingRemove !== null}
        title={t.confermaRimozioneTitolo}
        message={t.confermaRimozione}
        confirmLabel={t.elimina}
        cancelLabel={t.annulla}
        variant="danger"
        busy={busy}
        onConfirm={() => {
          const target = entries.find((e) => e.emailNorm === confirmingRemove);
          if (target) void handleRemove(target);
        }}
        onClose={() => setConfirmingRemove(null)}
      />
    </AppShell>
  );
}
