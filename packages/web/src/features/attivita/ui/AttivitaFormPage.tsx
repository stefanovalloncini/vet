import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AppShell,
  Button,
  ConfirmDialog,
  FormFooter,
  InlineError,
  LoadingHint,
  PageHeader,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useReferenceData } from "../hooks/useReferenceData";
import { useTariffaSuggestion } from "../hooks/useTariffaSuggestion";
import { useAttivitaFormLoader } from "../hooks/useAttivitaFormLoader";
import { useAttivitaFormSubmit } from "../hooks/useAttivitaFormSubmit";
import { QuickAddAziendaDialog } from "../../aziende/ui/QuickAddAziendaDialog";
import { QuickAddTipoDialog } from "../../activity-types/ui/QuickAddTipoDialog";
import { nextOrdine } from "../../activity-types/lib/ordine";
import { attivitaI18n as t } from "../i18n";
import { computeTotale } from "@vet/shared";
import {
  AttivitaFormFields,
  type AttivitaFormState,
} from "./AttivitaFormFields";

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addAziendaOpen, setAddAziendaOpen] = useState(false);
  const [addTipoOpen, setAddTipoOpen] = useState(false);

  const { form, setForm, loaded, loading } = useAttivitaFormLoader({
    id,
    cloneId,
    presetDate,
    repo,
  });

  const submitState = useAttivitaFormSubmit({
    isEdit,
    id,
    user,
    form,
    aziende: ref.aziende,
    tipi: ref.tipi,
    repo,
    reminders,
  });

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

  const nextTipoOrdine = useMemo(() => nextOrdine(ref.tipi), [ref.tipi]);

  function update<K extends keyof AttivitaFormState>(
    key: K,
    value: AttivitaFormState[K]
  ) {
    setForm((s) => ({ ...s, [key]: value }));
    submitState.clearFieldError(key);
  }

  function onTariffaInput(value: string) {
    update("tariffa", value);
    clearTariffaSuggestion();
  }

  const canDelete =
    isEdit &&
    (user?.caps.has("activities.delete.own") ?? false) &&
    loaded?.ownerUid === user?.uid;
  const canCreateAzienda = user?.caps.has("aziende.create") ?? false;
  const canCreateTipo = user?.caps.has("activity_types.manage") ?? false;

  if (loading || ref.loading) {
    return (
      <AppShell>
        <LoadingHint label={t.loading} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={isEdit ? t.titoloModifica : t.titoloNuova}
        back={{ to: "/attivita", label: t.back }}
      />

      <form onSubmit={submitState.submit} className="space-y-6 max-w-2xl">
        <AttivitaFormFields
          form={form}
          errors={submitState.errors}
          busy={submitState.busy}
          isEdit={isEdit}
          tariffaSuggested={tariffaSuggested}
          totaleLive={totaleLive}
          aziendaOptions={aziendaOptions}
          tipoOptions={tipoOptions}
          aziendaAction={
            canCreateAzienda ? (
              <button
                type="button"
                onClick={() => setAddAziendaOpen(true)}
                className="text-(--color-accent) hover:underline font-medium"
              >
                + Nuova
              </button>
            ) : null
          }
          tipoAction={
            canCreateTipo ? (
              <button
                type="button"
                onClick={() => setAddTipoOpen(true)}
                className="text-(--color-accent) hover:underline font-medium"
              >
                + Nuovo
              </button>
            ) : null
          }
          onUpdate={update}
          onTariffaInput={onTariffaInput}
        />
        <QuickAddAziendaDialog
          open={addAziendaOpen}
          onClose={() => setAddAziendaOpen(false)}
          onCreated={(a) => {
            ref.addAzienda(a);
            update("aziendaId", a.id);
          }}
        />
        <QuickAddTipoDialog
          open={addTipoOpen}
          onClose={() => setAddTipoOpen(false)}
          nextOrdine={nextTipoOrdine}
          onCreated={(tp) => {
            ref.addTipo(tp);
            update("tipoId", tp.id);
          }}
        />

        {submitState.globalError ? (
          <InlineError>{submitState.globalError}</InlineError>
        ) : null}

        <FormActions
          isEdit={isEdit}
          canDelete={canDelete}
          busy={submitState.busy}
          id={id}
          onDuplicate={() => navigate(`/attivita/nuova?clone=${id}`)}
          onDelete={() => setConfirmDelete(true)}
          onCancel={() => navigate("/attivita")}
        />
      </form>
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminare questa attività?"
        message={t.confermaEliminazione}
        confirmLabel={t.elimina}
        cancelLabel={t.annulla}
        variant="danger"
        busy={submitState.busy}
        onConfirm={() => {
          void submitState.deleteEntry();
          setConfirmDelete(false);
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </AppShell>
  );
}

interface FormActionsProps {
  isEdit: boolean;
  canDelete: boolean;
  busy: boolean;
  id: string | undefined;
  onDuplicate: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

function FormActions({
  canDelete,
  busy,
  onDuplicate,
  onDelete,
  onCancel,
}: FormActionsProps) {
  return (
    <FormFooter
      destructive={
        canDelete ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              disabled={busy}
            >
              Duplica
            </Button>
            <Button type="button" variant="ghost" onClick={onDelete} disabled={busy}>
              {t.elimina}
            </Button>
          </div>
        ) : null
      }
      actions={
        <>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            {t.annulla}
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {t.salva}
          </Button>
        </>
      }
    />
  );
}
