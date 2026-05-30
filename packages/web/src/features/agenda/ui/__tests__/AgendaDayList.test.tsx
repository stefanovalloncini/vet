import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { Attivita } from "@vet/shared";
import { AgendaDayList } from "../AgendaDayList";

vi.mock("../../../auth", async () => {
  const actual = await vi.importActual<typeof import("../../../auth")>("../../../auth");
  return {
    ...actual,
    useAuthState: () => ({
      user: {
        uid: "u1",
        email: "u1@vet.com",
        displayName: "Vet One",
        roleId: "vet",
        caps: new Set(["activities.create"]),
      },
      ready: true,
    }),
  };
});

function attivita(over: Partial<Attivita> = {}): Attivita {
  const data = over.data ?? new Date("2026-05-04T09:30:00");
  return {
    id: "a1",
    data,
    aziendaId: "az1",
    aziendaNome: "Cascina Verde",
    tipoId: "t1",
    tipoNome: "Ginecologia",
    oraria: false,
    adElemento: false,
    tariffa: 40,
    totale: 40,
    ownerUid: "u1",
    ownerEmail: "u1@vet.com",
    ownerName: "Vet One",
    createdAt: new Date("2026-05-04T18:00:00"),
    updatedAt: new Date("2026-05-04T18:00:00"),
    isDeleted: false,
    schemaVersion: 1,
    ...over,
  };
}

function renderList(items: Attivita[], date = new Date("2026-05-04T00:00:00")) {
  return render(
    <MemoryRouter>
      <AgendaDayList date={date} items={items} reminders={[]} />
    </MemoryRouter>
  );
}

describe("AgendaDayList", () => {
  it("labels the day section and exposes the heading via aria-live", () => {
    renderList([]);
    const section = screen.getByRole("region", { name: /Attività del giorno/i });
    expect(section).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("aria-live", "polite");
  });

  it("shows the empty-day message and the new-activity button when allowed", () => {
    renderList([]);
    expect(screen.getByText("Nessuna attività in agenda.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Nuova attività/i })
    ).toBeInTheDocument();
  });

  it("opens quick entry when the new-activity button is clicked", () => {
    const open = vi.fn();
    window.addEventListener("vet:quick-entry:open", open);
    renderList([]);
    fireEvent.click(screen.getByRole("button", { name: /Nuova attività/i }));
    window.removeEventListener("vet:quick-entry:open", open);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("renders the activity time from the activity date, not createdAt", () => {
    const { container } = renderList([
      attivita({ data: new Date("2026-05-04T09:30:00") }),
    ]);
    const cards = within(container);
    const time = cards.getByText("09:30");
    expect(time.tagName.toLowerCase()).toBe("time");
    expect(time).toHaveAttribute(
      "datetime",
      new Date("2026-05-04T09:30:00").toISOString()
    );
    expect(screen.queryByText("18:00")).not.toBeInTheDocument();
  });

  it("does not break with a very long azienda name", () => {
    const { container } = renderList([
      attivita({
        aziendaNome:
          "Società Agricola Allevamento Bovini da Latte della Bassa Pianura Padana e Dintorni",
      }),
    ]);
    const cards = within(container);
    expect(
      cards.getByText(/Società Agricola Allevamento Bovini/i)
    ).toBeInTheDocument();
  });
});
