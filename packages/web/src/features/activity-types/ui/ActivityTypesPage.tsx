import {
  AppShell,
  InlineError,
  LoadingHint,
  PageHeader,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import {
  useActivityTypesEditor,
  type ActivityTypesEditor,
} from "../hooks/useActivityTypesEditor";
import { activityTypesI18n as t } from "../i18n";
import { ActivityTypeList } from "./ActivityTypeList";

export function ActivityTypesPage() {
  const { user } = useAuthState();
  const editor = useActivityTypesEditor();
  const canManage = user?.caps.has("activity_types.manage") ?? false;

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {!canManage ? (
        <p className="-mt-3 mb-6 text-xs text-(--color-text-subtle) max-w-prose">
          {t.readonly}
        </p>
      ) : null}

      <div aria-live="polite">
        {editor.globalError ? (
          <InlineError className="mb-4">{editor.globalError}</InlineError>
        ) : null}
      </div>

      {renderBody({ editor, canManage })}
    </AppShell>
  );
}

interface BodyProps {
  editor: ActivityTypesEditor;
  canManage: boolean;
}

function renderBody({ editor, canManage }: BodyProps) {
  if (editor.loading) {
    return <LoadingHint label={t.loading} />;
  }
  if (editor.loadError) {
    return <InlineError>{t.erroreSalvataggio}</InlineError>;
  }
  return (
    <div className="space-y-8">
      <ActivityTypeList
        title={t.attivi}
        emptyTitle={t.attiviVuoto}
        items={editor.active}
        busyId={editor.busyId}
        canManage={canManage}
        actionLabel={t.disattiva}
        onToggle={editor.toggleActive}
        onSaveTariffa={editor.saveTariffa}
      />
      {editor.inactive.length > 0 ? (
        <ActivityTypeList
          title={t.archiviati}
          emptyTitle={t.archiviatiVuoto}
          items={editor.inactive}
          busyId={editor.busyId}
          canManage={canManage}
          actionLabel={t.attiva}
          onToggle={editor.toggleActive}
          onSaveTariffa={editor.saveTariffa}
        />
      ) : null}
    </div>
  );
}
