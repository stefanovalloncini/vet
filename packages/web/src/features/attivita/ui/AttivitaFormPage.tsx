import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppShell, Button, useToast } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useReferenceData } from "../hooks/useReferenceData";
import { useTariffaSuggestion } from "../hooks/useTariffaSuggestion";
import { attivitaI18n as t } from "../i18n";
import {
  attivitaInputSchema,
  computeTotale,
  type AttivitaInput,
  type Attivita,
} from "@vet/shared";
import { dateInputValue, parseDateInput } from "../lib/format";
import {
  AttivitaFormFields,
  type AttivitaFormState,
} from "./AttivitaFormFields";

function emptyForm(): AttivitaFormState {
  return {
    data: dateInputValue(new Date()),
    aziendaId: "",
    tipoId: "",
    oraria: false,
    tariffa: "",
    ore: "",
    note: "",
    reminderAt: "",
    reminderTitle: "",
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
  const { attivita: repo, reminders } = useRepositories();
  const ref = useReferenceData();
  const { notify } = useToast();

  const [form, setForm] = useState<AttivitaFormState>(emptyForm);
  const [loaded, setLoaded] = useState<Attivita | null>(null);
  const [loading, setLoading] = useState<boolean>(isEdit || cloneId !== null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AttivitaFormState, string>>
  >({});
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
        reminderAt: "",
        reminderTitle: "",
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, cloneId, isEdit, presetDate, navigate, repo]);

  const { suggested: tariffaSuggested, clear: clearTariffaSuggestion } =
    useTariffaSuggestion({
      aziendaId: form.aziendaId,
      tipoId: form.tipoId,
      tipi: ref.tipi,
      isEdit,
      currentTariffa: form.tariffa,
      onSuggest: (value) => setForm((s) => ({ ...s, tariffa: value })),
    });

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

  function update<K extends keyof AttivitaFormState>(
    key: K,
    value: AttivitaFormState[K]
  ) {
    setForm((s) => ({ ...s, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onTariffaInput(value: string) {
    update("tariffa", value);
    clearTariffaSuggestion();
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
      const fieldErrors: Partial<Record<keyof AttivitaFormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof AttivitaFormState;
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
        notify("Attività aggiornata", "success");
      } else {
        await repo.create(input, denorm, user);
        notify("Attività registrata", "success");
        const dueDate = parseDateInput(form.reminderAt);
        if (dueDate && form.reminderTitle.trim()) {
          try {
            await reminders.create(
              {
                aziendaId: azienda.id,
                titolo: form.reminderTitle.trim(),
                dueAt: dueDate,
              },
              { aziendaNome: azienda.nome },
              user
            );
            notify("Promemoria creato", "success");
          } catch {
            // reminder creation is best-effort
          }
        }
      }
      navigate("/attivita");
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
    try {
      await repo.softDelete(id, user);
      navigate("/attivita");
    } catch {
      setGlobalError(t.erroreSalvataggio);
      setBusy(false);
    }
  }

  const canDelete =
    isEdit &&
    (user?.caps.has("activities.delete.own") ?? false) &&
    loaded?.ownerUid === user?.uid;

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
        <AttivitaFormFields
          form={form}
          errors={errors}
          busy={busy}
          isEdit={isEdit}
          tariffaSuggested={tariffaSuggested}
          totaleLive={totaleLive}
          aziendaOptions={aziendaOptions}
          tipoOptions={tipoOptions}
          onUpdate={update}
          onTariffaInput={onTariffaInput}
        />

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
