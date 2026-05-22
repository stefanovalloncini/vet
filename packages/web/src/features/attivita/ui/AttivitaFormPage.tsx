import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell, Button, ConfirmDialog, FormFooter, PageHeader } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useReferenceData } from "../hooks/useReferenceData";
import { useTariffaSuggestion } from "../hooks/useTariffaSuggestion";
import { useAttivitaForm } from "../hooks/useAttivitaForm";
import { QuickAddAziendaDialog } from "../../aziende/ui/QuickAddAziendaDialog";
import { QuickAddTipoDialog } from "../../activity-types/ui/QuickAddTipoDialog";
import { nextOrdine } from "../../activity-types/lib/ordine";
import { attivitaI18n as t } from "../i18n";
import { computeTotale } from "@vet/shared";
import { AttivitaFormFields } from "./AttivitaFormFields";

export function AttivitaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const ref = useReferenceData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addAziendaOpen, setAddAziendaOpen] = useState(false);
  const [addTipoOpen, setAddTipoOpen] = useState(false);

  const f = useAttivitaForm({ id, user, aziende: ref.aziende, tipi: ref.tipi });

  const { suggested: tariffaSuggested, clear: clearTariffaSuggestion } =
    useTariffaSuggestion({
      aziendaId: f.form.aziendaId,
      tipoId: f.form.tipoId,
      tipi: ref.tipi,
      isEdit: f.isEdit,
      currentTariffa: f.form.tariffa,
      onSuggest: (value) => f.setForm((s) => ({ ...s, tariffa: value })),
    });

  const totaleLive = useMemo(() => {
    const tariffa = Number(f.form.tariffa);
    const ore = Number(f.form.ore);
    if (!Number.isFinite(tariffa) || tariffa <= 0) return null;
    if (f.form.oraria && (!Number.isFinite(ore) || ore <= 0)) return null;
    return computeTotale({
      oraria: f.form.oraria,
      tariffa,
      ...(f.form.oraria ? { ore } : {}),
    });
  }, [f.form.tariffa, f.form.ore, f.form.oraria]);

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

  const canDelete =
    f.isEdit &&
    (user?.caps.has("activities.delete.own") ?? false) &&
    f.loaded?.ownerUid === user?.uid;
  const canCreateAzienda = user?.caps.has("aziende.create") ?? false;
  const canCreateTipo = user?.caps.has("activity_types.manage") ?? false;

  if (f.initialLoading || ref.loading) {
    return (
      <AppShell>
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={f.isEdit ? t.titoloModifica : t.titoloNuova}
        back={{ to: "/attivita", label: t.back }}
      />
      <form onSubmit={f.submit} className="space-y-6 max-w-2xl">
        <AttivitaFormFields
          form={f.form}
          errors={f.errors}
          busy={f.busy}
          isEdit={f.isEdit}
          tariffaSuggested={tariffaSuggested}
          totaleLive={totaleLive}
          aziendaOptions={aziendaOptions}
          tipoOptions={tipoOptions}
          aziendaAction={
            canCreateAzienda ? <AddLink onClick={() => setAddAziendaOpen(true)} label="+ Nuova" /> : null
          }
          tipoAction={
            canCreateTipo ? <AddLink onClick={() => setAddTipoOpen(true)} label="+ Nuovo" /> : null
          }
          onUpdate={f.update}
          onTariffaInput={(v) => {
            f.update("tariffa", v);
            clearTariffaSuggestion();
          }}
        />
        <QuickAddAziendaDialog
          open={addAziendaOpen}
          onClose={() => setAddAziendaOpen(false)}
          onCreated={(a) => {
            ref.addAzienda(a);
            f.update("aziendaId", a.id);
          }}
        />
        <QuickAddTipoDialog
          open={addTipoOpen}
          onClose={() => setAddTipoOpen(false)}
          nextOrdine={nextTipoOrdine}
          onCreated={(tp) => {
            ref.addTipo(tp);
            f.update("tipoId", tp.id);
          }}
        />
        {f.globalError ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {f.globalError}
          </p>
        ) : null}
        <FormActions
          busy={f.busy}
          destructive={
            canDelete ? (
              <DeleteActions
                busy={f.busy}
                onDuplicate={() => navigate(`/attivita/nuova?clone=${id}`)}
                onDelete={() => setConfirmDelete(true)}
              />
            ) : null
          }
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
        busy={f.busy}
        onConfirm={() => {
          void f.remove();
          setConfirmDelete(false);
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </AppShell>
  );
}

function AddLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="text-(--color-accent) hover:underline font-medium">
      {label}
    </button>
  );
}

function DeleteActions({
  busy,
  onDuplicate,
  onDelete,
}: {
  busy: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={onDuplicate} disabled={busy}>
        Duplica
      </Button>
      <Button type="button" variant="ghost" onClick={onDelete} disabled={busy}>
        {t.elimina}
      </Button>
    </div>
  );
}

function FormActions({
  busy,
  destructive,
  onCancel,
}: {
  busy: boolean;
  destructive: ReactNode;
  onCancel: () => void;
}) {
  return (
    <FormFooter
      destructive={destructive}
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
