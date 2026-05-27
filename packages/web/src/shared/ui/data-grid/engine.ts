// The ONLY file in data-grid/ allowed to import @tanstack/react-table.
// Exposes pure helpers used by modes. Mode components never import directly.
import { sortingFns } from "@tanstack/react-table";
import type {
  Column,
  FilterDef,
  FilterValue,
  GroupingDef,
  SortState,
} from "./types";

// ---------- Sort ----------

export interface SortableColumnView<T> {
  id: string;
  accessor: (row: T) => unknown;
}

function compareValues(a: unknown, b: unknown): number {
  // mimic TanStack alphanumeric/datetime sorting semantics by delegating to sortingFns where useful
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === "number" && typeof b === "number") {
    return sortingFns.basic({ getValue: () => a } as never, { getValue: () => b } as never, "x");
  }
  const sa = String(a);
  const sb = String(b);
  // alphanumeric, locale-aware-ish
  return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
}

export function applySort<T>(
  rows: ReadonlyArray<T>,
  columns: ReadonlyArray<SortableColumnView<T>>,
  sort: SortState | null | undefined
): ReadonlyArray<T> {
  if (!sort) return rows;
  const col = columns.find((c) => c.id === sort.columnId);
  if (!col) return rows;
  const dir = sort.direction === "asc" ? 1 : -1;
  const arr = rows.slice();
  arr.sort((ra, rb) => dir * compareValues(col.accessor(ra), col.accessor(rb)));
  return arr;
}

// ---------- Filters ----------

export interface FilterableColumnView<T> {
  id: string;
  filterId?: string;
  accessor: (row: T) => unknown;
}

function matchesText(value: unknown, query: string): boolean {
  if (query === "") return true;
  if (value == null) return false;
  return String(value).toLowerCase().includes(query.toLowerCase());
}

function matchesSelect(value: unknown, selected: string): boolean {
  if (selected === "") return true;
  if (value == null) return false;
  return String(value) === selected;
}

function matchesMulti(value: unknown, selected: ReadonlyArray<string>): boolean {
  if (selected.length === 0) return true;
  if (value == null) return false;
  return selected.includes(String(value));
}

function matchesBoolean(value: unknown, expected: boolean): boolean {
  return Boolean(value) === expected;
}

function matchesDateRange(value: unknown, range: readonly [string, string]): boolean {
  const [from, to] = range;
  if (!from && !to) return true;
  if (value == null) return false;
  let asDate: Date | null = null;
  if (value instanceof Date) asDate = value;
  else if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) asDate = d;
  }
  if (!asDate) return false;
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime()) && asDate < d) return false;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      // include the whole day
      d.setHours(23, 59, 59, 999);
      if (asDate > d) return false;
    }
  }
  return true;
}

function isFilterActive(v: FilterValue): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v !== "";
  if (typeof v === "number") return Number.isFinite(v);
  if (typeof v === "boolean") return true;
  if (Array.isArray(v)) {
    // Could be string[] (multi-select) or [string, string] (date-range)
    if (v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string") {
      return v[0] !== "" || v[1] !== "";
    }
    return v.length > 0;
  }
  return false;
}

export function applyFilters<T>(
  rows: ReadonlyArray<T>,
  columns: ReadonlyArray<FilterableColumnView<T>>,
  filters: ReadonlyArray<FilterDef>
): ReadonlyArray<T> {
  const active = filters.filter((f) => isFilterActive(f.value));
  if (active.length === 0) return rows;

  return rows.filter((row) => {
    for (const f of active) {
      const col = columns.find((c) => (c.filterId ?? c.id) === f.id);
      const value = col ? col.accessor(row) : undefined;
      switch (f.kind) {
        case "text": {
          if (!matchesText(value, typeof f.value === "string" ? f.value : String(f.value ?? ""))) {
            return false;
          }
          break;
        }
        case "select": {
          if (!matchesSelect(value, typeof f.value === "string" ? f.value : String(f.value ?? ""))) {
            return false;
          }
          break;
        }
        case "multi-select": {
          const arr = Array.isArray(f.value) ? (f.value as ReadonlyArray<string>) : [];
          if (!matchesMulti(value, arr)) return false;
          break;
        }
        case "boolean": {
          if (typeof f.value !== "boolean") return false;
          if (!matchesBoolean(value, f.value)) return false;
          break;
        }
        case "date-range": {
          const range = Array.isArray(f.value)
            ? (f.value as unknown as readonly [string, string])
            : (["", ""] as const);
          if (!matchesDateRange(value, range)) return false;
          break;
        }
      }
    }
    return true;
  });
}

// ---------- Grouping ----------

export interface GroupedBucket<T> {
  key: string;
  rows: ReadonlyArray<T>;
}

export function groupRows<T>(
  rows: ReadonlyArray<T>,
  grouping: GroupingDef<T> | undefined
): ReadonlyArray<GroupedBucket<T>> {
  if (!grouping) return [{ key: "__all__", rows }];
  const map = new Map<string, T[]>();
  const order: string[] = [];
  for (const row of rows) {
    const key = grouping.keyOf(row);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      map.set(key, [row]);
      order.push(key);
    }
  }
  return order.map((key) => ({ key, rows: map.get(key) ?? [] }));
}

// ---------- Visible Columns ----------

export function visibleColumns<T>(
  columns: ReadonlyArray<Column<T>>,
  hidden: ReadonlySet<string>
): ReadonlyArray<Column<T>> {
  return columns.filter((c) => !hidden.has(c.id));
}
