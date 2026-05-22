import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useAziendaFormLoader } from "../hooks/useAziendaFormLoader";
import { useAziendaFormSubmit } from "../hooks/useAziendaFormSubmit";
import { aziendeI18n as t } from "../i18n";
import {
  AziendaFormFields,
  type AziendaFormState,
} from "./AziendaFormFields";

export function AziendaFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { aziende: repo } = useRepositories();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { form, setForm, loaded, loading } = useAziendaFormLoader({ id, repo });
  const submitState = useAziendaFormSubmit({
    isEdit,
    id,
    user,
    form,
    loaded,
    repo,
  });

  function update<K extends keyof AziendaFormState>(
    key: K,
    value: AziendaFormState[K]
  ) {
    setForm((s) => ({ ...s, [key]: value }));
    submitState.clearFieldError(key);
  }

  const canDelete = isEdit && (user?.caps.has("aziende.update") ?? false);
  const title = isEdit ? t.titoloModifica : t.titoloNuova;
  const header = <PageHeader title={title} back={{ to: "/aziende", label: t.back }} />;

  if (loading) {
    return (
      <AppShell>
        {header}
        <LoadingHint label={t.loading} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {header}
      <form onSubmit={submitState.submit} className="space-y-6 max-w-2xl">
        <AziendaFormFields
          form={form}
          errors={submitState.errors}
          busy={submitState.busy}
          onUpdate={update}
        />

        {submitState.globalError ? (
          <InlineError>{submitState.globalError}</InlineError>
        ) : null}

        <FormActions
          canDelete={canDelete}
          busy={submitState.busy}
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
