import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "../DataGrid";
import { dataGridIt } from "../i18n";
import type { Column, FilterDef, GroupingDef } from "../types";

interface Row {
  id: string;
  data: string;
  azienda: string;
  tipo: string;
  modalita: string;
  ore: number;
  tariffa: number;
  totale: number;
  veterinario: string;
  status: string;
  pagato: boolean;
}

const rows: Row[] = [
  {
    id: "1",
    data: "2025-01-10",
    azienda: "Acme",
    tipo: "Visita",
    modalita: "oraria",
    ore: 2,
    tariffa: 50,
    totale: 100,
    veterinario: "Rossi",
    status: "open",
    pagato: false,
  },
  {
    id: "2",
    data: "2025-01-12",
    azienda: "Beta",
    tipo: "Vaccino",
    modalita: "fissa",
    ore: 1,
    tariffa: 30,
    totale: 30,
    veterinario: "Bianchi",
    status: "closed",
    pagato: true,
  },
  {
    id: "3",
    data: "2025-01-15",
    azienda: "Acme",
    tipo: "Visita",
    modalita: "oraria",
    ore: 3,
    tariffa: 50,
    totale: 150,
    veterinario: "Rossi",
    status: "open",
    pagato: false,
  },
];

const columns: ReadonlyArray<Column<Row>> = [
  { id: "data", header: "Data", accessor: (r) => r.data },
  { id: "azienda", header: "Azienda", accessor: (r) => r.azienda },
  { id: "tipo", header: "Tipo", accessor: (r) => r.tipo },
  { id: "modalita", header: "Modalità", accessor: (r) => r.modalita },
  { id: "ore", header: "Ore", accessor: (r) => r.ore, align: "end" },
  { id: "tariffa", header: "Tariffa", accessor: (r) => r.tariffa, align: "end" },
  { id: "totale", header: "Totale", accessor: (r) => r.totale, align: "end" },
  { id: "veterinario", header: "Veterinario", accessor: (r) => r.veterinario },
  { id: "status", header: "Stato", accessor: (r) => r.status },
  { id: "pagato", header: "Pagato", accessor: (r) => r.pagato },
];

const filters: ReadonlyArray<FilterDef> = [
  { id: "status", label: "Stato", kind: "select", value: "open", options: [
    { value: "", label: "Tutti" },
    { value: "open", label: "Aperti" },
    { value: "closed", label: "Chiusi" },
  ] },
  { id: "azienda", label: "Azienda", kind: "text", value: "" },
];

const groupBy: GroupingDef<Row> = {
  keyOf: (r) => r.azienda,
  labelOf: (key) => key,
};

describe("DataGrid integration contract", () => {
  it("snapshot of 10 cols + sort + filters + group", () => {
    const { container } = render(
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        i18n={dataGridIt}
        defaultSort={{ columnId: "totale", direction: "desc" }}
        filters={filters}
        groupBy={groupBy}
        toolbar={{
          showColumnsToggle: true,
          showExport: { csv: true, pdf: true },
          pdfTitle: "Attività",
          filenameStem: "attivita",
        }}
      />
    );
    expect(container.innerHTML).toMatchSnapshot();
  });
});
