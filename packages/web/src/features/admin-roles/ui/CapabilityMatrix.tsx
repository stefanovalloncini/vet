import { useMemo } from "react";
import {
  CAPABILITIES,
  CAPABILITY_LABELS,
  type Capability,
} from "@vet/shared";
import { Card } from "../../../shared/ui";
import { CAP_GROUPS, rolesI18n as t } from "../i18n";

interface CapabilityMatrixProps {
  value: ReadonlySet<Capability>;
  onChange: (next: ReadonlySet<Capability>) => void;
  readonly: boolean;
}

interface CapGroup {
  label: string;
  items: ReadonlyArray<Capability>;
}

function buildGroups(): ReadonlyArray<CapGroup> {
  return CAP_GROUPS.map((g) => ({
    label: t[g.label] as string,
    items: CAPABILITIES.filter((c) => c.startsWith(g.prefix)),
  })).filter((g) => g.items.length > 0);
}

export function CapabilityMatrix({
  value,
  onChange,
  readonly,
}: CapabilityMatrixProps) {
  const groups = useMemo(buildGroups, []);

  function toggle(cap: Capability) {
    if (readonly) return;
    const next = new Set(value);
    if (next.has(cap)) next.delete(cap);
    else next.add(cap);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.label}>
          <h3 className="text-sm font-medium text-(--color-text) mb-3">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.items.map((cap) => (
              <label
                key={cap}
                className={[
                  "flex items-center gap-3 py-1.5 rounded-md",
                  readonly
                    ? ""
                    : "cursor-pointer hover:bg-(--color-surface-muted) px-2 -mx-2",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={value.has(cap)}
                  onChange={() => toggle(cap)}
                  disabled={readonly}
                  className="w-4 h-4 accent-(--color-accent)"
                />
                <span className="text-sm text-(--color-text)">
                  {CAPABILITY_LABELS[cap]}
                </span>
                <span className="text-[10px] text-(--color-text-subtle) font-mono ml-auto">
                  {cap}
                </span>
              </label>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
