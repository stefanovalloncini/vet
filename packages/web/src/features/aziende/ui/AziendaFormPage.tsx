import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell, Button, ConfirmDialog, FormFooter, PageHeader } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useAziendaForm } from "../hooks/useAziendaForm";
import { aziendeI18n as t } from "../i18n";
import { AziendaFormFields } from "./AziendaFormFields";

export function AziendaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { aziende: repo } = useRepositories();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const f = useAziendaForm({ id, user, repo });

  const canDelete = f.isEdit && (user?.caps.has("aziende.update") ?? false);
  const title = f.isEdit ? t.titoloModifica : t.titoloNuova;
  const header = <PageHeader title={title} back={{ to: "/aziende", label: t.back }} />;

  if (f.loading) {
    return (
      <AppShell>
        {header}
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {header}
      <form onSubmit={f.submit} className="space-y-6 max-w-2xl">
        <AziendaFormFields
          form={f.form}
          errors={f.errors}
          busy={f.busy}
          onUpdate={f.update}
        />
        {f.globalError ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {f.globalError}
          </p>
        ) : null}
        <FormActions
          canDelete={canDelete}
          busy={f.busy}
          onDelete={() => setConfirmDelete(true)}
          onCancel={() => navigate("/aziende")}
        />
      </form>
      <ConfirmDialog
        open={confirmDelete}
        title="Archiviare questa azienda?"
        message={t.confermaEliminazioneDescr}
        confirmLabel={t.elimina}
        cancelLabel={t.annulla}
        variant="danger"
        busy={f.busy}
        onConfirm={() => {
          void f.deleteEntry();
          setConfirmDelete(false);
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </AppShell>
  );
}

interface FormActionsProps {
  canDelete: boolean;
  busy: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

function FormActions({ canDelete, busy, onDelete, onCancel }: FormActionsProps) {
  return (
    <FormFooter
      destructive={
        canDelete ? (
          <Button type="button" variant="ghost" onClick={onDelete} disabled={busy}>
            {t.elimina}
          </Button>
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
