import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AppShell,
  Button,
  ConfirmDialog,
  useToast,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { aziendeI18n as t } from "../i18n";
import {
  aziendaInputSchema,
  normalizeAziendaNome,
  type AziendaInput,
  type Azienda,
} from "@vet/shared";
import {
  AziendaFormFields,
  emptyAziendaForm,
  type AziendaFormState,
} from "./AziendaFormFields";

export function AziendaFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { aziende: repo } = useRepositories();
  const { notify } = useToast();

  const [form, setForm] = useState<AziendaFormState>(emptyAziendaForm);
  const [loadedAzienda, setLoadedAzienda] = useState<Azienda | null>(null);
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AziendaFormState, string>>
  >({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    void (async () => {
      const a = await repo.getById(id);
      if (cancelled) return;
      if (!a) {
        navigate("/aziende", { replace: true });
        return;
      }
      setLoadedAzienda(a);
      setForm({
        nome: a.nome,
        indirizzo: a.indirizzo ?? "",
        telefono: a.telefono ?? "",
        piva: a.piva ?? "",
        emailFatturazione: a.emailFatturazione ?? "",
        cadenzaFatturazione: a.cadenzaFatturazione ?? "",
        tipoAllevamento: a.tipoAllevamento ?? "",
        numeroCapi: a.numeroCapi !== undefined ? String(a.numeroCapi) : "",
        note: a.note ?? "",
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate, repo]);

  const title = isEdit ? t.titoloModifica : t.titoloNuova;

  function update<K extends keyof AziendaFormState>(
    key: K,
    value: AziendaFormState[K]
  ) {
    setForm((s) => ({ ...s, [key]: value }));
    if (errors[key]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function buildInput(): { ok: true; input: AziendaInput } | { ok: false } {
    const candidate: Record<string, unknown> = { nome: form.nome };
    if (form.indirizzo.trim()) candidate["indirizzo"] = form.indirizzo.trim();
    if (form.telefono.trim()) candidate["telefono"] = form.telefono.trim();
    if (form.piva.trim()) candidate["piva"] = form.piva.trim();
    if (form.emailFatturazione.trim())
      candidate["emailFatturazione"] = form.emailFatturazione.trim();
    if (form.cadenzaFatturazione)
      candidate["cadenzaFatturazione"] = form.cadenzaFatturazione;
    if (form.tipoAllevamento)
      candidate["tipoAllevamento"] = form.tipoAllevamento;
    if (form.numeroCapi.trim())
      candidate["numeroCapi"] = Number(form.numeroCapi);
    if (form.note.trim()) candidate["note"] = form.note.trim();

    const parsed = aziendaInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof AziendaFormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof AziendaFormState;
        if (path === "piva") fieldErrors.piva = t.errorePivaNonValida;
        else if (path === "emailFatturazione")
          fieldErrors.emailFatturazione = t.erroreEmailNonValida;
        else if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return { ok: false };
    }
    return { ok: true, input: parsed.data };
  }

  async function ensureUnique(input: AziendaInput): Promise<boolean> {
    const norm = normalizeAziendaNome(input.nome);
    if (isEdit && loadedAzienda && loadedAzienda.nomeNorm === norm) return true;
    const existing = await repo.findByNomeNorm(norm);
    if (existing && existing.id !== id) {
      setErrors({ nome: t.erroreNomeDuplicato });
      return false;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setGlobalError(null);
    try {
      const built = buildInput();
      if (!built.ok) return;
      if (!(await ensureUnique(built.input))) return;
      if (isEdit && id) {
        await repo.update(id, built.input, user);
        notify("Azienda aggiornata", "success");
      } else {
        await repo.create(built.input, user);
        notify("Azienda creata", "success");
      }
      navigate("/aziende");
    } catch {
      setGlobalError(t.erroreSalvataggio);
      notify(t.erroreSalvataggio, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !id || !user) return;
    setBusy(true);
    setGlobalError(null);
    try {
      await repo.softDelete(id, user);
      notify("Azienda archiviata", "success");
      navigate("/aziende");
    } catch {
      setGlobalError(t.erroreSalvataggio);
      setBusy(false);
    }
  }

  const canDelete = isEdit && (user?.caps.has("aziende.update") ?? false);

  const heading = useMemo(
    () => (
      <header className="mb-8">
        <button
          type="button"
          onClick={() => navigate("/aziende")}
          className="text-sm text-(--color-text-muted) hover:text-(--color-text) mb-3"
        >
          ← {t.back}
        </button>
        <h1 className="text-3xl font-medium tracking-tight text-(--color-text)">
          {title}
        </h1>
      </header>
    ),
    [navigate, title]
  );

  if (loading) {
    return (
      <AppShell>
        {heading}
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {heading}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <AziendaFormFields
          form={form}
          errors={errors}
          busy={busy}
          onUpdate={update}
        />

        {globalError ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {globalError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                {t.elimina}
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/aziende")}
              disabled={busy}
            >
              {t.annulla}
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {t.salva}
            </Button>
          </div>
        </div>
      </form>
      <ConfirmDialog
        open={confirmDelete}
        title="Archiviare questa azienda?"
        message={t.confermaEliminazioneDescr}
        confirmLabel={t.elimina}
        cancelLabel={t.annulla}
        variant="danger"
        busy={busy}
        onConfirm={() => {
          void handleDelete();
          setConfirmDelete(false);
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </AppShell>
  );
}
