import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "../DataGrid";
import { dataGridIt } from "../i18n";
import type { Column } from "../types";

interface Row {
  id: string;
  name: string;
  ore: number;
  status: string;
}

const rows: Row[] = [
  { id: "1", name: "Alfa", ore: 3, status: "open" },
  { id: "2", name: "Beta", ore: 8, status: "closed" },
  { id: "3", name: "Gamma", ore: 5, status: "open" },
  { id: "4", name: "Delta", ore: 1, status: "closed" },
  { id: "5", name: "Epsilon", ore: 2, status: "open" },
];

const columns: ReadonlyArray<Column<Row>> = [
  { id: "name", header: "Nome", accessor: (r) => r.name },
  { id: "ore", header: "Ore", accessor: (r) => r.ore, align: "end" },
  { id: "status", header: "Stato", accessor: (r) => r.status },
];

describe("DataGrid (table mode)", () => {
  it("renders header cells and all rows", () => {
    render(
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        i18n={dataGridIt}
      />
    );
    expect(screen.getByRole("columnheader", { name: /Nome/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Ore/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Stato/ })).toBeInTheDocument();
    for (const r of rows) {
      expect(screen.getByText(r.name)).toBeInTheDocument();
    }
  });

  it("shows empty state when rows is empty", () => {
    render(
      <DataGrid rows={[]} columns={columns} getRowId={(r) => r.id} i18n={dataGridIt} />
    );
    expect(screen.getByText(dataGridIt.empty)).toBeInTheDocument();
  });
});
