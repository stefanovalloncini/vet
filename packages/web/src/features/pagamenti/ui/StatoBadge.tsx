import type { JSX } from "react";
import { Badge } from "../../../shared/ui";
import { pagamentiI18n as t } from "../i18n";

export type StatoBadgeStatus = "ok" | "unpaid" | "todo";

export interface StatoBadgeProps {
  status: StatoBadgeStatus;
  size?: "sm" | "md";
}

interface BadgeMeta {
  tone: "success" | "warning" | "danger";
  label: string;
}

const META: Record<StatoBadgeStatus, BadgeMeta> = {
  ok: { tone: "success", label: t.statoOk },
  unpaid: { tone: "danger", label: t.statoUnpaid },
  todo: { tone: "warning", label: t.statoTodo },
};

export function StatoBadge({ status, size = "md" }: StatoBadgeProps): JSX.Element {
  const meta = META[status];
  return (
    <Badge tone={meta.tone} size={size} dot aria-label={meta.label}>
      {meta.label}
    </Badge>
  );
}
