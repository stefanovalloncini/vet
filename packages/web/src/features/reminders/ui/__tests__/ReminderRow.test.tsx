import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Reminder } from "@vet/shared";
import { ReminderRow } from "../ReminderRow";

function at(daysFromNow: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

const base: Reminder = {
  id: "r-1",
  aziendaId: "az-1",
  aziendaNome: "Allevamento Verde",
  titolo: "Richiamo vaccinazione",
  dueAt: at(3),
  note: "",
  done: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "uid-1",
  schemaVersion: 1,
};

function renderRow(overrides: Partial<Parameters<typeof ReminderRow>[0]> = {}) {
  const props = {
    reminder: base,
    canUpdate: true,
    canDelete: true,
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  } satisfies Parameters<typeof ReminderRow>[0];
  return { props, ...render(<ReminderRow {...props} />) };
}

describe("ReminderRow", () => {
  it("renders the title and azienda", () => {
    renderRow();
    expect(screen.getByText("Richiamo vaccinazione")).toBeInTheDocument();
    expect(screen.getByText("Allevamento Verde")).toBeInTheDocument();
  });

  it("falls back to a placeholder when the title is empty", () => {
    renderRow({ reminder: { ...base, titolo: "   " } });
    expect(screen.getByText("Senza titolo")).toBeInTheDocument();
  });

  it("omits the azienda chip when the name is empty", () => {
    renderRow({ reminder: { ...base, aziendaNome: "" } });
    expect(screen.queryByText("Allevamento Verde")).not.toBeInTheDocument();
  });

  it("labels the checkbox with an action, not the current state", () => {
    renderRow();
    expect(
      screen.getByRole("checkbox", { name: /segna come fatto/i })
    ).toBeInTheDocument();
  });

  it("switches the checkbox action label when done", () => {
    renderRow({ reminder: { ...base, done: true } });
    expect(
      screen.getByRole("checkbox", { name: /segna come da fare/i })
    ).toBeInTheDocument();
  });

  it("shows an overdue label for past due dates", () => {
    renderRow({ reminder: { ...base, dueAt: at(-2) } });
    expect(screen.getByText(/Scaduto di 2 giorni/)).toBeInTheDocument();
  });

  it("fires onToggle and onDelete", () => {
    const { props } = renderRow();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(props.onToggle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /Elimina/i }));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it("hides the checkbox when canUpdate is false", () => {
    renderRow({ canUpdate: false });
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("hides the delete button when canDelete is false", () => {
    renderRow({ canDelete: false });
    expect(screen.queryByRole("button", { name: /Elimina/i })).toBeNull();
  });

  it("renders very long titles, aziende and notes without crashing", () => {
    const longTitle = "Promemoria".repeat(40);
    const longNote = "x".repeat(600);
    renderRow({
      reminder: {
        ...base,
        titolo: longTitle,
        aziendaNome: "Azienda".repeat(40),
        note: longNote,
      },
    });
    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(screen.getByText(longNote)).toBeInTheDocument();
  });
});
