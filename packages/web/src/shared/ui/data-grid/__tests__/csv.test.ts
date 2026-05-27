import { describe, expect, it } from "vitest";
import { quoteCsvCell, toCsv } from "../export/csv";
import type { Column } from "../types";

interface Row {
  name: string;
  amount: number;
  note: string;
}

const cols: ReadonlyArray<Column<Row>> = [
  { id: "name", header: "Name", accessor: (r) => r.name },
  { id: "amount", header: "Amount", accessor: (r) => r.amount },
  { id: "note", header: "Note", accessor: (r) => r.note },
];

describe("quoteCsvCell", () => {
  it("prefixes ' for formula-injection guard", () => {
    expect(quoteCsvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(quoteCsvCell("+1")).toBe("'+1");
    expect(quoteCsvCell("-1")).toBe("'-1");
    expect(quoteCsvCell("@me")).toBe("'@me");
    expect(quoteCsvCell(" leading")).toBe("' leading");
  });

  it("quotes cells with semicolon, quote, CR or LF", () => {
    expect(quoteCsvCell('a"b')).toBe('"a""b"');
    expect(quoteCsvCell("a;b")).toBe('"a;b"');
    expect(quoteCsvCell("a\r\nb")).toBe('"a\r\nb"');
  });

  it("leaves plain values untouched", () => {
    expect(quoteCsvCell("hello")).toBe("hello");
  });
});

describe("toCsv", () => {
  it("produces BOM + CRLF + Italian decimals + semicolons", () => {
    const rows: Row[] = [
      { name: "Alfa", amount: 12.5, note: "ok" },
      { name: "Beta", amount: 8, note: "" },
    ];
    const out = toCsv(cols, rows);
    expect(out.startsWith("﻿")).toBe(true);
    expect(out.endsWith("\r\n")).toBe(true);
    const lines = out.slice(1).split("\r\n");
    expect(lines[0]).toBe("Name;Amount;Note");
    expect(lines[1]).toBe("Alfa;12,5;ok");
    expect(lines[2]).toBe("Beta;8;");
    // trailing empty line from CRLF terminator
    expect(lines[3]).toBe("");
  });

  it("guards formula injection inline", () => {
    const rows: Row[] = [{ name: "=evil", amount: 0, note: "" }];
    const out = toCsv(cols, rows);
    expect(out).toContain("'=evil");
  });
});
