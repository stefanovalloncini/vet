import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataGrid } from "../DataGrid";
import { dataGridIt } from "../i18n";
import type { Column } from "../types";

interface Row {
  id: string;
  name: string;
}

const rows: Row[] = [
  { id: "1", name: "Alfa" },
  { id: "2", name: "Beta" },
  { id: "3", name: "Gamma" },
];

const columns: ReadonlyArray<Column<Row>> = [
  { id: "name", header: "Nome", accessor: (r) => r.name },
];

describe("DataGrid (cards mode)", () => {
  it("invokes card renderer once per row", () => {
    const card = vi.fn((row: Row) => <div data-testid={`card-${row.id}`}>{row.name}</div>);
    render(
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        i18n={dataGridIt}
        mode="cards"
        card={card}
      />
    );
    expect(card).toHaveBeenCalledTimes(rows.length);
    for (const r of rows) {
      expect(screen.getByTestId(`card-${r.id}`)).toBeInTheDocument();
    }
  });
});
