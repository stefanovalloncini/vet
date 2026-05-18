import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AppShell,
  Button,
  Card,
  Select,
  TextArea,
  TextField,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { aziendeI18n as t } from "../i18n";
import {
  aziendaInputSchema,
  normalizeAziendaNome,
  type AziendaInput,
  type CadenzaFatturazione,
  type TipoAllevamento,
  type Azienda,
} from "@vet/shared";

interface FormState {
  nome: string;
  indirizzo: string;
  telefono: string;
  piva: string;
  emailFatturazione: string;
  cadenzaFatturazione: CadenzaFatturazione | "";
  tipoAllevamento: TipoAllevamento | "";
  numeroCapi: string;
  note: string;
}

const empty: FormState = {
  nome: "",
  indirizzo: "",
  telefono: "",
  piva: "",
  emailFatturazione: "",
  cadenzaFatturazione: "",
  tipoAllevamento: "",
  numeroCapi: "",
  note: "",
};

const CADENZA_OPTIONS = [
  { value: "", label: t.campoCadenzaNessuna },
  { value: "monthly", label: t.campoCadenzaMensile },
  { value: "quarterly", label: t.campoCadenzaTrimestrale },
  { value: "semiannual", label: t.campoCadenzaSemestrale },
];

const TIPO_OPTIONS = [
  { value: "", label: t.campoTipoNessuno },
  { value: "bovini", label: t.tipoBovini },
  { value: "ovini", label: t.tipoOvini },
  { value: "caprini", label: t.tipoCaprini },
  { value: "suini", label: t.tipoSuini },
  { value: "avicoli", label: t.tipoAvicoli },
  { value: "equini", label: t.tipoEquini },
  { value: "misto", label: t.tipoMisto },
  { value: "altro", label: t.tipoAltro },
];

export function AziendaFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { aziende: repo } = useRepositories();

  const [form, setForm] = useState<FormState>(empty);
  const [loadedAzienda, setLoadedAzienda] = useState<Azienda | null>(null);
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
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
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof FormState;
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
      } else {
        await repo.create(built.input, user);
      }
      navigate("/aziende");
    } catch {
      setGlobalError(t.erroreSalvataggio);
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
        <Card>
          <div className="space-y-5">
            <TextField
              id="nome"
              label={t.campoNome}
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              required
              hint={t.campoNomeHint}
              error={errors.nome}
              disabled={busy}
              autoFocus
              maxLength={200}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TextField
                id="indirizzo"
                label={t.campoIndirizzo}
                value={form.indirizzo}
                onChange={(e) => update("indirizzo", e.target.value)}
                error={errors.indirizzo}
                disabled={busy}
                maxLength={300}
              />
              <TextField
                id="telefono"
                label={t.campoTelefono}
                value={form.telefono}
                onChange={(e) => update("telefono", e.target.value)}
                error={errors.telefono}
                disabled={busy}
                maxLength={40}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Select
                id="tipo-allevamento"
                label={t.campoTipoAllevamento}
                value={form.tipoAllevamento}
                onChange={(e) =>
                  update(
                    "tipoAllevamento",
                    (e.target.value as TipoAllevamento | "") ?? ""
                  )
                }
                options={TIPO_OPTIONS}
                disabled={busy}
              />
              <TextField
                id="numero-capi"
                type="number"
                min="0"
                max="100000"
                step="1"
                label={t.campoNumeroCapi}
                value={form.numeroCapi}
                onChange={(e) => update("numeroCapi", e.target.value)}
                error={errors.numeroCapi}
                disabled={busy}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TextField
                id="piva"
                label={t.campoPiva}
                value={form.piva}
                onChange={(e) => update("piva", e.target.value)}
                error={errors.piva}
                disabled={busy}
                maxLength={13}
                placeholder="12345678903"
              />
              <Select
                id="cadenza"
                label={t.campoCadenza}
                value={form.cadenzaFatturazione}
                onChange={(e) =>
                  update(
                    "cadenzaFatturazione",
                    (e.target.value as CadenzaFatturazione | "") ?? ""
                  )
                }
                options={CADENZA_OPTIONS}
                disabled={busy}
              />
            </div>
            <TextField
              id="email-fatturazione"
              type="email"
              label={t.campoEmailFatturazione}
              value={form.emailFatturazione}
              onChange={(e) => update("emailFatturazione", e.target.value)}
              error={errors.emailFatturazione}
              disabled={busy}
              maxLength={120}
            />
            <TextArea
              id="note"
              label={t.campoNote}
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              error={errors.note}
              disabled={busy}
              maxLength={1000}
            />
          </div>
        </Card>

        {globalError ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {globalError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {canDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-(--color-text-muted)">
                    {t.confermaEliminazione}
                  </span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={busy}
                  >
                    {t.elimina}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={busy}
                  >
                    {t.annulla}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                >
                  {t.elimina}
                </Button>
              )
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
    </AppShell>
  );
}
