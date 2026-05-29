import { useId } from "react";
import { TextField } from "../TextField";
import { Select } from "../Select";
import { SegmentedControl } from "../SegmentedControl";
import type { FilterDef, FilterValue } from "./types";

interface FilterBarProps {
  filters: ReadonlyArray<FilterDef>;
  onChange: (next: ReadonlyArray<FilterDef>) => void;
  i18nLabels: { tutti: string; si: string; no: string };
}

function updateFilter(
  filters: ReadonlyArray<FilterDef>,
  id: string,
  value: FilterValue
): ReadonlyArray<FilterDef> {
  return filters.map((f) => (f.id === id ? { ...f, value } : f));
}

export function FilterBar({ filters, onChange, i18nLabels }: FilterBarProps) {
  const reactId = useId();
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-muted)/40 p-2">
      {filters.map((f) => {
        const fieldId = `${reactId}-${f.id}`;
        if (f.kind === "text") {
          const value = typeof f.value === "string" ? f.value : "";
          return (
            <div key={f.id} className="min-w-[11rem]">
              <TextField
                compact
                id={fieldId}
                label={f.label}
                value={value}
                onChange={(e) => onChange(updateFilter(filters, f.id, e.target.value))}
              />
            </div>
          );
        }
        if (f.kind === "select") {
          const value = typeof f.value === "string" ? f.value : "";
          const opts = f.options ?? [];
          return (
            <div key={f.id} className="min-w-[11rem]">
              <Select
                compact
                id={fieldId}
                label={f.label}
                value={value}
                options={opts}
                onChange={(e) => onChange(updateFilter(filters, f.id, e.target.value))}
              />
            </div>
          );
        }
        if (f.kind === "multi-select") {
          const arr = Array.isArray(f.value) ? (f.value as ReadonlyArray<string>) : [];
          const opts = f.options ?? [];
          return (
            <div key={f.id} className="min-w-[11rem]">
              <label
                htmlFor={fieldId}
                className="block text-[11px] uppercase tracking-wider font-medium text-(--color-text-muted) mb-1"
              >
                {f.label}
              </label>
              <select
                id={fieldId}
                multiple
                value={[...arr]}
                onChange={(e) => {
                  const selected: string[] = [];
                  for (const opt of e.target.selectedOptions) selected.push(opt.value);
                  onChange(updateFilter(filters, f.id, selected));
                }}
                className="w-full min-h-[2.25rem] rounded-md border border-(--color-border) bg-(--color-surface) px-3.5 py-1.5 text-sm text-(--color-text) focus:outline-none focus:border-(--color-accent) hover:border-(--color-border-strong)"
              >
                {opts.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (f.kind === "date-range") {
          const range = Array.isArray(f.value)
            ? (f.value as unknown as readonly [string, string])
            : (["", ""] as const);
          const from = range[0] ?? "";
          const to = range[1] ?? "";
          return (
            <div key={f.id} className="grid grid-cols-2 gap-2">
              <TextField
                compact
                id={`${fieldId}-from`}
                type="date"
                label={`${f.label} ↦`}
                value={from}
                onChange={(e) =>
                  onChange(updateFilter(filters, f.id, [e.target.value, to] as const))
                }
              />
              <TextField
                compact
                id={`${fieldId}-to`}
                type="date"
                label={`${f.label} ↤`}
                value={to}
                onChange={(e) =>
                  onChange(updateFilter(filters, f.id, [from, e.target.value] as const))
                }
              />
            </div>
          );
        }
        // boolean
        const triState: "all" | "yes" | "no" =
          f.value === true ? "yes" : f.value === false ? "no" : "all";
        return (
          <SegmentedControl<"all" | "yes" | "no">
            key={f.id}
            label={f.label}
            value={triState}
            onChange={(next) => {
              const v: FilterValue = next === "all" ? null : next === "yes";
              onChange(updateFilter(filters, f.id, v));
            }}
            segments={[
              { value: "all", label: i18nLabels.tutti },
              { value: "yes", label: i18nLabels.si },
              { value: "no", label: i18nLabels.no },
            ]}
          />
        );
      })}
    </div>
  );
}
