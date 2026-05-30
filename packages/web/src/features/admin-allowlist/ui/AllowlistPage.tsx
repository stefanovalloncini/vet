import { useMemo, useState } from "react";
import { AdminLayout, PageHeader, Tabs } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useAllowlist } from "../hooks/useAllowlist";
import { usePendingUsers } from "../hooks/usePendingUsers";
import { useAccessRequests } from "../hooks/useAccessRequests";
import { allowlistI18n as t } from "../i18n";
import { mergeAccessQueue } from "../lib/mergeAccessQueue";
import { AllowlistTab } from "./AllowlistTab";
import { AccessQueueTab } from "./AccessQueueTab";

type View = "allowlist" | "requests";

export function AllowlistPage() {
  const { user } = useAuthState();
  const { entries, roles, loading, error } = useAllowlist();
  const canApprove = user?.caps.has("users.approve") ?? false;
  const canManageAllowlist = user?.caps.has("allowlist.manage") ?? false;
  const pending = usePendingUsers();
  const requests = useAccessRequests();
  const [view, setView] = useState<View>("allowlist");

  const canSeeQueue = canApprove || canManageAllowlist;
  const showTabs = canSeeQueue;

  const queueCount = useMemo(
    () => mergeAccessQueue(pending.items, requests.items).length,
    [pending.items, requests.items]
  );

  const tabs = [
    { value: "allowlist" as const, label: t.tabAllowlist },
    ...(canSeeQueue
      ? [
          {
            value: "requests" as const,
            label: t.tabRequests,
            ...(queueCount > 0 ? { badge: queueCount } : {}),
          },
        ]
      : []),
  ];

  return (
    <AdminLayout>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {showTabs ? (
        <div className="mb-3">
          <Tabs items={tabs} value={view} onChange={setView} size="sm" />
        </div>
      ) : null}

      {showTabs ? (
        <p className="mb-5 text-xs text-(--color-text-subtle) max-w-prose">
          {view === "requests" ? t.tabRequestsDescr : t.tabAllowlistDescr}
        </p>
      ) : null}

      {view === "requests" ? (
        <AccessQueueTab roles={roles} />
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
