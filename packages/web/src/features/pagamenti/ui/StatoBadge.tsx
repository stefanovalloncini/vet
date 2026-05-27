import type { JSX } from "react";
import { Badge } from "../../../shared/ui";
import { statoForKey, type StatoKey } from "../lib/status";

export type StatoBadgeStatus = StatoKey;

export interface StatoBadgeProps {
  status: StatoBadgeStatus;
  size?: "sm" | "md";
}

export function StatoBadge({ status, size = "md" }: StatoBadgeProps): JSX.Element {
  const meta = statoForKey(status);
  return (
    <Badge tone={meta.tone} size={size} dot aria-label={meta.label}>
      {meta.label}
    </Badge>
  );
}
