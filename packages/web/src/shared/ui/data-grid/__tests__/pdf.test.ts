import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildAutoTableConfig, exportToPdf } from "../export/pdf";
import type { Column } from "../types";

interface Row {
  name: string;
  amount: number;
}

const cols: ReadonlyArray<Column<Row>> = [
  { id: "name", header: "Name", accessor: (r) => r.name },
  { id: "amount", header: "Amount", accessor: (r) => r.amount },
];

const docMock = {
  save: vi.fn(),
  text: vi.fn(),
};
const autoTableMock = vi.fn();
const jsPdfCtor = vi.fn(() => docMock);

vi.mock("jspdf", () => ({
  jsPDF: jsPdfCtor,
  default: jsPdfCtor,
}));

vi.mock("jspdf-autotable", () => ({
  default: autoTableMock,
}));

describe("buildAutoTableConfig", () => {
  it("produces head + body matching columns and rows", () => {
    const rows: Row[] = [
      { name: "Alfa", amount: 12.5 },
      { name: "Beta", amount: 7 },
    ];
    const cfg = buildAutoTableConfig(cols, rows);
    expect(cfg.head).toEqual([["Name", "Amount"]]);
    expect(cfg.body).toEqual([
      ["Alfa", "12,5"],
      ["Beta", "7"],
    ]);
  });

  it("includes startY when provided", () => {
    const cfg = buildAutoTableConfig(cols, [], { startY: 30 });
    expect(cfg.startY).toBe(30);
  });
});

describe("exportToPdf", () => {
  beforeEach(() => {
    docMock.save.mockClear();
    docMock.text.mockClear();
    autoTableMock.mockClear();
    jsPdfCtor.mockClear();
  });

  it("lazy-loads jspdf and autotable and calls them with correct config", async () => {
    const rows: Row[] = [{ name: "Alfa", amount: 1.5 }];
    await exportToPdf(cols, rows, { title: "T", filename: "out.pdf" });
    expect(jsPdfCtor).toHaveBeenCalledTimes(1);
    expect(docMock.text).toHaveBeenCalledWith("T", 14, 16);
    expect(autoTableMock).toHaveBeenCalledTimes(1);
    const callArgs = autoTableMock.mock.calls[0]!;
    expect(callArgs[0]).toBe(docMock);
    const cfg = callArgs[1] as { head: string[][]; body: string[][]; startY?: number };
    expect(cfg.head).toEqual([["Name", "Amount"]]);
    expect(cfg.body).toEqual([["Alfa", "1,5"]]);
    expect(cfg.startY).toBe(22);
    expect(docMock.save).toHaveBeenCalledWith("out.pdf");
  });

  it("uses default filename when not given", async () => {
    await exportToPdf(cols, []);
    expect(docMock.save).toHaveBeenCalledWith("export.pdf");
  });
});
