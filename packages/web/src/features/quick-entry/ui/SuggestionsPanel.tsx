import { useMemo, useState } from "react";
import { Tabs, type TabItem } from "../../../shared/ui";
import { formatEuro } from "../../../shared/lib/format";
import type { Combo, ComputeCombosResult } from "../lib/recentCombos";
import { formatRelativeDay } from "../lib/formatRelativeDay";

type Tab = "recent" | "frequent";

const FREQUENT_THRESHOLD = 5;

interface SuggestionsPanelProps {
  combos: ComputeCombosResult;
  active?: { aziendaId: string; tipoId: string } | null;
  onPick: (combo: Combo) => void;
}

function isSameCombo(
  c: { aziendaId: string; tipoId: string },
  a?: { aziendaId: string; tipoId: string } | null
): boolean {
  return !!a && a.aziendaId === c.aziendaId && a.tipoId === c.tipoId;
}

export function SuggestionsPanel({ combos, active, onPick }: SuggestionsPanelProps) {
  const [tab, setTab] = useState<Tab>("recent");
  const now = useMemo(() => new Date(), []);

  if (combos.recents.length === 0) return null;

  const showFrequents = combos.frequents.length >= FREQUENT_THRESHOLD;
  const list = tab === "frequent" && showFrequents ? combos.frequents : combos.recents;
  const activeTab: Tab = showFrequents ? tab : "recent";

  const tabItems: ReadonlyArray<TabItem<Tab>> = showFrequents
    ? [
        { value: "recent", label: "Recenti" },
        { value: "frequent", label: "Frequenti" },
      ]
    : [{ value: "recent", label: "Recenti" }];

  return (
    <div className="rounded-lg border border-(--color-border) bg-(--color-surface-muted) overflow-hidden">
      <div className="px-1">
        <Tabs
          items={tabItems}
          value={activeTab}
          onChange={setTab}
          size="sm"
          label="Voci suggerite"
        />
      </div>
      <ul className="divide-y divide-(--color-border)">
        {list.map((c) => {
          const pressed = isSameCombo(c, active);
          const hint =
            activeTab === "recent"
              ? formatRelativeDay(c.lastUsed, now)
              : `× ${c.count} ${c.count === 1 ? "volta" : "volte"}`;
          return (
            <li key={`${c.aziendaId}::${c.tipoId}`}>
              <button
                type="button"
                aria-pressed={pressed}
                onClick={() => onPick(c)}
                className={[
                  "w-full px-3 py-2 flex items-center justify-between gap-3 text-left",
                  "transition-colors duration-(--motion-fast) ease-(--ease-out-quart)",
                  "hover:bg-(--color-surface) focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--color-accent)",
                  pressed ? "bg-(--color-surface)" : "",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-(--color-text) truncate">
                    <span className="font-medium">{c.aziendaNome}</span>
                    <span className="text-(--color-text-muted)"> · {c.tipoNome}</span>
                  </p>
                  <p className="text-xs text-(--color-text-muted) mt-0.5">{hint}</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-(--color-text) tabular-nums">
                  {formatEuro(c.tariffa)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
