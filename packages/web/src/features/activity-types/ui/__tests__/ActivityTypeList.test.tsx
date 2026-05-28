import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GINECOLOGIA_TIPO_ID, type ActivityType } from "@vet/shared";
import { ActivityTypeList } from "../ActivityTypeList";

function makeTipo(overrides: Partial<ActivityType> = {}): ActivityType {
  return {
    id: "visita",
    nome: "Visita",
    ordine: 10,
    attivo: true,
    tariffaStandard: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
    ...overrides,
  };
}

function renderList(items: ActivityType[], canManage = true) {
  render(
    <ActivityTypeList
      title="Attivi"
      emptyTitle="Nessun tipo attivo."
      items={items}
      busyId={null}
      canManage={canManage}
      actionLabel="Disattiva"
      onToggle={vi.fn()}
      onSaveTariffa={vi.fn()}
    />
  );
}

describe("ActivityTypeList", () => {
  it("links the section to its heading for assistive tech", () => {
    renderList([makeTipo()]);
    const section = screen.getByRole("region", { name: /Attivi/i });
    expect(section).toBeInTheDocument();
  });

  it("renders each row spanning the full grid width", () => {
    renderList([makeTipo()]);
    const name = screen.getByText("Visita");
    const card = name.closest("div.sm\\:col-span-2");
    expect(card).not.toBeNull();
    expect((card as HTMLElement).className).toContain("lg:col-span-3");
  });

  it("shows the localized empty state when there are no items", () => {
    renderList([]);
    expect(screen.getByText("Nessun tipo attivo.")).toBeInTheDocument();
  });

  it("renders the tariffa editor for a normal type when manageable", () => {
    renderList([makeTipo()]);
    expect(screen.getByLabelText(/Tariffa standard/i)).toBeInTheDocument();
  });

  it("does not render the tariffa editor for ginecologia", () => {
    renderList([makeTipo({ id: GINECOLOGIA_TIPO_ID, nome: "Ginecologia" })]);
    expect(screen.queryByLabelText(/Tariffa standard/i)).toBeNull();
    expect(screen.getByText(/tariffa per cliente/i)).toBeInTheDocument();
  });

  it("shows a status badge instead of the toggle when not manageable", () => {
    renderList([makeTipo()], false);
    expect(screen.queryByRole("button", { name: /Disattiva/i })).toBeNull();
    expect(screen.getByText("attivo")).toBeInTheDocument();
  });
});
