import { describe, expect, it } from "vitest";
import { applyFilters, applySort, groupRows } from "../engine";
import type { Column, FilterDef } from "../types";

interface Row {
  id: string;
  name: string;
  ore: number;
  status: "open" | "closed";
}

const rows: ReadonlyArray<Row> = [
  { id: "1", name: "Alfa", ore: 3, status: "open" },
  { id: "2", name: "Beta", ore: 8, status: "closed" },
  { id: "3", name: "Gamma", ore: 5, status: "open" },
  { id: "4", name: "Delta", ore: 1, status: "closed" },
];

const columns: ReadonlyArray<Column<Row>> = [
  { id: "name", header: "Name", accessor: (r) => r.name },
  { id: "ore", header: "Ore", accessor: (r) => r.ore },
  { id: "status", header: "Status", accessor: (r) => r.status },
];

describe("applySort", () => {
  it("sorts numeric column desc", () => {
    const out = applySort(rows, columns, { columnId: "ore", direction: "desc" });
    expect(out.map((r) => r.ore)).toEqual([8, 5, 3, 1]);
  });

  it("sorts numeric column asc", () => {
    const out = applySort(rows, columns, { columnId: "ore", direction: "asc" });
    expect(out.map((r) => r.ore)).toEqual([1, 3, 5, 8]);
  });

  it("sorts string column case-insensitively asc", () => {
    const out = applySort(rows, columns, { columnId: "name", direction: "asc" });
    expect(out.map((r) => r.name)).toEqual(["Alfa", "Beta", "Delta", "Gamma"]);
  });

  it("returns input when sort is null", () => {
    const out = applySort(rows, columns, null);
    expect(out).toBe(rows);
  });

  it("returns input when columnId unknown", () => {
    const out = applySort(rows, columns, { columnId: "missing", direction: "asc" });
    expect(out).toBe(rows);
  });
});

describe("applyFilters", () => {
  it("filters by select on string column", () => {
    const f: FilterDef = { id: "status", label: "Status", kind: "select", value: "open" };
    const out = applyFilters(rows, columns, [f]);
    expect(out.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("filters by text contains", () => {
    const f: FilterDef = { id: "name", label: "Name", kind: "text", value: "ta" };
    const out = applyFilters(rows, columns, [f]);
    expect(out.map((r) => r.name)).toEqual(["Beta", "Delta"]);
  });

  it("returns all when no filter active", () => {
    const f: FilterDef = { id: "status", label: "Status", kind: "select", value: "" };
    const out = applyFilters(rows, columns, [f]);
    expect(out).toBe(rows);
  });

  it("multi-select picks the intersection of values", () => {
    const f: FilterDef = {
      id: "status",
      label: "Status",
      kind: "multi-select",
      value: ["open"],
    };
    const out = applyFilters(rows, columns, [f]);
    expect(out.map((r) => r.id)).toEqual(["1", "3"]);
  });
});

describe("groupRows", () => {
  it("partitions rows preserving first-seen order", () => {
    const grouped = groupRows(rows, {
      keyOf: (r) => r.status,
      labelOf: (key) => key,
    });
    expect(grouped.map((g) => g.key)).toEqual(["open", "closed"]);
    expect(grouped[0]!.rows.map((r) => r.id)).toEqual(["1", "3"]);
    expect(grouped[1]!.rows.map((r) => r.id)).toEqual(["2", "4"]);
  });

  it("returns a single bucket when no grouping defined", () => {
    const grouped = groupRows(rows, undefined);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]!.rows).toBe(rows);
  });
});
