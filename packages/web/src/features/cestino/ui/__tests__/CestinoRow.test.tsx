import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Attivita } from "@vet/shared";
import { CestinoRow } from "../CestinoRow";

const base: Attivita = {
  id: "att-1",
  data: new Date("2026-05-20T00:00:00Z"),
  aziendaId: "az-1",
  aziendaNome: "Allevamento Verde",
  tipoId: "t-1",
  tipoNome: "Visita",
  oraria: false,
  tariffa: 50,
  ore: 1,
  totale: 50,
  note: "",
  ownerUid: "uid-1",
  ownerEmail: "mario@example.com",
  ownerName: "Mario Rossi",
  createdAt: new Date("2026-05-20T00:00:00Z"),
  updatedAt: new Date("2026-05-20T00:00:00Z"),
  isDeleted: true,
  deletedAt: new Date("2026-05-21T00:00:00Z"),
  deletedBy: "uid-1",
  schemaVersion: 1,
};

function renderRow(overrides: Partial<Parameters<typeof CestinoRow>[0]> = {}) {
  const props = {
    attivita: base,
    busy: false,
    canRestore: true,
    canPurge: true,
    onRestore: vi.fn(),
    onPurgeAsk: vi.fn(),
    ...overrides,
  } satisfies Parameters<typeof CestinoRow>[0];
  return { props, ...render(<CestinoRow {...props} />) };
}

describe("CestinoRow", () => {
  it("shows azienda, tipo and owner", () => {
    renderRow();
    expect(screen.getByText("Allevamento Verde")).toBeInTheDocument();
    expect(screen.getByText("Visita")).toBeInTheDocument();
    expect(screen.getByText(/Mario Rossi/)).toBeInTheDocument();
  });

  it("fires onRestore and onPurgeAsk when buttons are clicked", () => {
    const { props } = renderRow();
    fireEvent.click(screen.getByRole("button", { name: /Ripristina/i }));
    expect(props.onRestore).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /Elimina ora/i }));
    expect(props.onPurgeAsk).toHaveBeenCalledTimes(1);
  });

  it("hides restore button when canRestore is false", () => {
    renderRow({ canRestore: false });
    expect(screen.queryByRole("button", { name: /Ripristina/i })).toBeNull();
  });

  it("hides purge button when canPurge is false", () => {
    renderRow({ canPurge: false });
    expect(screen.queryByRole("button", { name: /Elimina ora/i })).toBeNull();
  });

  it("disables all actions while busy", () => {
    renderRow({ busy: true });
    expect(screen.getByRole("button", { name: /Ripristina/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Elimina ora/i })).toBeDisabled();
  });
});
