import { useState } from "react";
import { AdminLayout, PageHeader, Tabs } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useAllowlist } from "../hooks/useAllowlist";
import { useAccessRequests } from "../hooks/useAccessRequests";
import { allowlistI18n as t } from "../i18n";
import { AllowlistTab } from "./AllowlistTab";
import { PendingUsersTab } from "./PendingUsersTab";
import { AccessRequestsTab } from "./AccessRequestsTab";

type View = "allowlist" | "pending" | "requests";

export function AllowlistPage() {
  const { user } = useAuthState();
  const { entries, roles, loading, error } = useAllowlist();
  const canApprove = user?.caps.has("users.approve") ?? false;
  const canManageAllowlist = user?.caps.has("allowlist.manage") ?? false;
  const requestsState = useAccessRequests();
  const [view, setView] = useState<View>("allowlist");

  const showTabs = canApprove || canManageAllowlist;

  const tabs = [
    { value: "allowlist" as const, label: t.tabAllowlist },
    ...(canApprove ? [{ value: "pending" as const, label: t.tabPending }] : []),
    ...(canManageAllowlist
      ? [
          {
            value: "requests" as const,
            label:
              requestsState.items.length > 0
                ? `${t.tabRequests} (${requestsState.items.length})`
                : t.tabRequests,
          },
        ]
      : []),
  ];

  return (
    <AdminLayout>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {showTabs ? (
        <div className="mb-6">
          <Tabs items={tabs} value={view} onChange={setView} size="sm" />
        </div>
      ) : null}

      {view === "pending" ? (
        <PendingUsersTab roles={roles} />
      ) : view === "requests" ? (
        <AccessRequestsTab roles={roles} />
      ) : (
        <AllowlistTab
          entries={entries}
          roles={roles}
          loading={loading}
          error={error}
        />
      )}
    </AdminLayout>
  );
}
