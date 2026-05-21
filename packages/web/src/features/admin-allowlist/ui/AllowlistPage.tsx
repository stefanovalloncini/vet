import { useState } from "react";
import { AppShell, PageHeader, Tabs } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useAllowlist } from "../hooks/useAllowlist";
import { allowlistI18n as t } from "../i18n";
import { AllowlistTab } from "./AllowlistTab";
import { PendingUsersTab } from "./PendingUsersTab";

type View = "allowlist" | "pending";

export function AllowlistPage() {
  const { user } = useAuthState();
  const { entries, roles, loading, error, refresh } = useAllowlist();
  const canApprove = user?.caps.has("users.approve") ?? false;
  const [view, setView] = useState<View>("allowlist");

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {canApprove ? (
        <div className="mb-6">
          <Tabs
            items={[
              { value: "allowlist", label: t.tabAllowlist },
              { value: "pending", label: t.tabPending },
            ]}
            value={view}
            onChange={setView}
            size="sm"
          />
        </div>
      ) : null}

      {view === "pending" ? (
        <PendingUsersTab roles={roles} />
      ) : (
        <AllowlistTab
          entries={entries}
          roles={roles}
          loading={loading}
          error={error}
          refresh={refresh}
        />
      )}
    </AppShell>
  );
}
