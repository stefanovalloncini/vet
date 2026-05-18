import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { useReferenceData } from "../hooks/useReferenceData";
import { attivitaI18n as t } from "../i18n";
import {
  attivitaInputSchema,
  computeTotale,
  GINECOLOGIA_TIPO_ID,
  type AttivitaInput,
  type Attivita,
} from "@vet/shared";
import { dateInputValue, formatEuro, parseDateInput } from "../lib/format";

interface FormState {
  data: string;
  aziendaId: string;
  tipoId: string;
  oraria: boolean;
  tariffa: string;
  ore: string;
  note: string;
}

function emptyForm(): FormState {
  return {
    data: dateInputValue(new Date()),
    aziendaId: "",
    tipoId: "",
    oraria: false,
    tariffa: "",
    ore: "",
    note: "",
  };
}

export function AttivitaFormPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const cloneId = params.get("clone");
  const presetDate = params.get("data");
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { attivita: repo } = useRepositories();
  const ref = useReferenceData();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loaded, setLoaded] = useState<Attivita | null>(null);
  const [loading, setLoading] = useState<boolean>(isEdit || cloneId !== null);
  const [busy, setBusy] = useState(false);
  const [tariffaSuggested, setTariffaSuggested] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isEdit && !cloneId) {
      if (presetDate) {
        setForm((s) => ({ ...s, data: presetDate }));
      }
      return;
    }
    const targetId = id ?? cloneId;
    if (!targetId) return;
    let cancelled = false;
    void (async () => {
      const a = await repo.getById(targetId);
      if (cancelled) return;
      if (!a) {
        navigate("/attivita", { replace: true });
        return;
      }
      if (isEdit) setLoaded(a);
      setForm({
        data: isEdit ? dateInputValue(a.data) : dateInputValue(new Date()),
        aziendaId: a.aziendaId,
        tipoId: a.tipoId,
        oraria: a.oraria,
        tariffa: String(a.tariffa),
        ore: a.ore !== undefined ? String(a.ore) : "",
        note: isEdit ? a.note ?? "" : "",
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, cloneId, isEdit, presetDate, navigate, repo]);

  useEffect(() => {
    if (isEdit) return;
    if (!form.aziendaId || form.tipoId !== GINECOLOGIA_TIPO_ID) {
      setTariffaSuggested(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const last = await repo.findLastByAziendaAndTipo(form.aziendaId, GINECOLOGIA_TIPO_ID);
      if (cancelled) return;
      if (last) {
        setForm((s) =>
          s.tariffa === "" ? { ...s, tariffa: String(last.tariffa) } : s
        );
        setTariffaSuggested(true);
      } else {
        setTariffaSuggested(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.aziendaId, form.tipoId, isEdit, repo]);

  const totaleLive = useMemo(() => {
    const tariffa = Number(form.tariffa);
    const ore = Number(form.ore);
    if (!Number.isFinite(tariffa) || tariffa <= 0) return null;
    if (form.oraria && (!Number.isFinite(ore) || ore <= 0)) return null;
    return computeTotale({
      oraria: form.oraria,
      tariffa,
      ...(form.oraria ? { ore } : {}),
    });
  }, [form.tariffa, form.ore, form.oraria]);

  const aziendaOptions = useMemo(
    () => [
      { value: "", label: t.selezionaAzienda },
      ...ref.aziende.map((a) => ({ value: a.id, label: a.nome })),
    ],
    [ref.aziende]
  );
  const tipoOptions = useMemo(
    () => [
      { value: "", label: t.selezionaTipo },
      ...ref.tipi.map((tipo) => ({ value: tipo.id, label: tipo.nome })),
    ],
    [ref.tipi]
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function buildInput(): AttivitaInput | null {
    const date = parseDateInput(form.data);
    if (!date) {
      setErrors((e) => ({ ...e, data: "Data non valida" }));
      return null;
    }
    const tariffa = Number(form.tariffa);
    const candidate: Record<string, unknown> = {
      data: date,
      aziendaId: form.aziendaId,
      tipoId: form.tipoId,
      oraria: form.oraria,
      tariffa,
    };
    if (form.oraria) candidate["ore"] = Number(form.ore);
    if (form.note.trim()) candidate["note"] = form.note.trim();

    const parsed = attivitaInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof FormState;
        if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return null;
    }
    return parsed.data;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setGlobalError(null);
    const input = buildInput();
    if (!input) return;
    const azienda = ref.aziende.find((a) => a.id === input.aziendaId);
    const tipo = ref.tipi.find((tp) => tp.id === input.tipoId);
    if (!azienda || !tipo) {
      setGlobalError(t.erroreSalvataggio);
      return;
    }
    setBusy(true);
    try {
      const denorm = { aziendaNome: azienda.nome, tipoNome: tipo.nome };
      if (isEdit && id) {
        await repo.update(id, input, denorm, user);
      } else {
        await repo.create(input, denorm, user);
      }
      navigate("/attivita");
    } catch {
      setGlobalError(t.erroreSalvataggio);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !id || !user) return;
    setBusy(true);
    try {
      await repo.softDelete(id, user);
      navigate("/attivita");
    } catch {
      setGlobalError(t.erroreSalvataggio);
      setBusy(false);
    }
  }

  const canDelete = isEdit && (user?.caps.has("activities.delete.own") ?? false) && loaded?.ownerUid === user?.uid;

  if (loading || ref.loading) {
    return (
      <AppShell>
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-8">
        <button
          type="button"
          onClick={() => navigate("/attivita")}
          className="text-sm text-(--color-text-muted) hover:text-(--color-text) mb-3"
        >
          ← {t.back}
        </button>
        <h1 className="text-3xl font-medium tracking-tight text-(--color-text)">
          {isEdit ? t.titoloModifica : t.titoloNuova}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TextField
                id="data"
                type="date"
                label={t.campoData}
                value={form.data}
                onChange={(e) => update("data", e.target.value)}
                required
                error={errors.data}
                disabled={busy}
              />
              <Select
                id="azienda"
                label={t.campoAzienda}
                value={form.aziendaId}
                onChange={(e) => update("aziendaId", e.target.value)}
                options={aziendaOptions}
                error={errors.aziendaId}
                disabled={busy}
              />
            </div>
            <Select
              id="tipo"
              label={t.campoTipo}
              value={form.tipoId}
              onChange={(e) => update("tipoId", e.target.value)}
              options={tipoOptions}
              error={errors.tipoId}
              disabled={busy}
            />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.oraria}
                onChange={(e) => {
                  update("oraria", e.target.checked);
                  if (!e.target.checked) update("ore", "");
                }}
                disabled={busy}
                className="w-4 h-4 accent-(--color-accent)"
              />
              <span className="text-sm text-(--color-text)">
                {t.campoOraria}
              </span>
            </label>
            <p className="text-xs text-(--color-text-subtle) -mt-3 ml-7">
              {t.campoOrariaHint}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TextField
                id="tariffa"
                type="number"
                step="0.01"
                min="0.01"
                max="100000"
                label={t.campoTariffa}
                value={form.tariffa}
                onChange={(e) => {
                  update("tariffa", e.target.value);
                  setTariffaSuggested(false);
                }}
                required
                error={errors.tariffa}
                disabled={busy}
                hint={tariffaSuggested ? t.ginecologiaSuggerita : undefined}
              />
              {form.oraria ? (
                <TextField
                  id="ore"
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  label={t.campoOre}
                  value={form.ore}
                  onChange={(e) => update("ore", e.target.value)}
                  required
                  error={errors.ore}
                  disabled={busy}
                />
              ) : null}
            </div>

            <TextArea
              id="note"
              label={t.campoNote}
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              error={errors.note}
              disabled={busy}
              maxLength={2000}
            />

            {totaleLive !== null ? (
              <div className="flex items-baseline justify-between pt-2 border-t border-(--color-border)">
                <span className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                  {t.totale}
                </span>
                <span className="text-2xl font-medium text-(--color-text) tabular-nums">
                  {formatEuro(totaleLive)}
                </span>
              </div>
            ) : null}
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
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/attivita/nuova?clone=${id}`)}
                    disabled={busy}
                  >
                    Duplica
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirmDelete(true)}
                    disabled={busy}
                  >
                    {t.elimina}
                  </Button>
                </div>
              )
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/attivita")}
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
