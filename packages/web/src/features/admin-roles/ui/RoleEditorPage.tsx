import { useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AppShell,
  Button,
  Card,
  InlineError,
  LoadingHint,
  PageHeader,
  SectionLabel,
  TextField,
  TextArea,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useRoleEditor } from "../hooks/useRoleEditor";
import { CapabilityMatrix } from "./CapabilityMatrix";
import { rolesI18n as t } from "../i18n";

export function RoleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthState();

  const editor = useRoleEditor({
    user,
    ...(id !== undefined ? { id } : {}),
  });

  useEffect(() => {
    if (editor.notFound) navigate("/admin/ruoli", { replace: true });
  }, [editor.notFound, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const outcome = await editor.save();
    if (outcome.kind === "saved") navigate("/admin/ruoli");
  }

  if (editor.loading) {
    return (
      <AppShell>
        <LoadingHint label={t.loading} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={editor.isEdit ? t.titoloModifica : t.titoloNuovo}
        back={{ to: "/admin/ruoli", label: t.back }}
        {...(editor.isLocked ? { subtitle: t.blocked } : {})}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Card>
          <div className="space-y-5">
            {!editor.isEdit ? (
              <TextField
                id="role-id"
                label={t.campoId}
                value={editor.draftId}
                onChange={(e) => editor.setDraftId(e.target.value)}
                hint={t.campoIdHint}
                required
                disabled={editor.busy}
              />
            ) : null}
            <TextField
              id="role-name"
              label={t.campoNome}
              value={editor.name}
              onChange={(e) => editor.setName(e.target.value)}
              required
              disabled={editor.busy || editor.readonly}
              maxLength={60}
            />
            <TextArea
              id="role-description"
              label={t.campoDescrizione}
              value={editor.description}
              onChange={(e) => editor.setDescription(e.target.value)}
              disabled={editor.busy || editor.readonly}
              maxLength={300}
            />
          </div>
        </Card>

        <section>
          <SectionLabel as="h2" className="font-medium mb-3">
            {t.sezioneCap}
          </SectionLabel>
          <CapabilityMatrix
            value={editor.capabilities}
            onChange={editor.setCapabilities}
            readonly={editor.readonly}
          />
        </section>

        {editor.loadError ? <InlineError>{editor.loadError}</InlineError> : null}
        {editor.error ? <InlineError>{editor.error}</InlineError> : null}

        {editor.readonly ? null : (
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/admin/ruoli")}
              disabled={editor.busy}
            >
              {t.annulla}
            </Button>
            <Button type="submit" variant="primary" disabled={editor.busy}>
              {t.salva}
            </Button>
          </div>
        )}
      </form>
    </AppShell>
  );
}
