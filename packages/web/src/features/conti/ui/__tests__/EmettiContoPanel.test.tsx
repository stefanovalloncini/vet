import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  ActorContext,
  Attivita,
  Azienda,
  Repositories,
} from "@vet/shared";
import {
  InMemoryAuthService,
  InMemoryContiRepository,
} from "@vet/shared/testing";
import type { Capability } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { EmettiContoPanel } from "../EmettiContoPanel";
import { defaultPeriodoFor } from "../../lib/contoPreview";
import { dateInputValue } from "../../../../shared/lib/format";

vi.mock("../../../../shared/pdf", () => ({
  ContoDocument: () => null,
  ProformaDocument: () => null,
  downloadPdf: vi.fn().mockResolvedValue(undefined),
  openWhatsappShare: vi.fn().mockReturnValue(true),
}));

function actor(caps: Capability[]): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(caps),
    approved: true,
  };
}

function azienda(over: Partial<Azienda> = {}): Azienda {
  return {
    id: "az1",
    nome: "Cascina Verdi",
    nomeNorm: "cascina verdi",
    cadenzaFatturazione: "quarterly",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    createdBy: "vet-1",
    updatedBy: "vet-1",
    createdByName: "Vet One",
    updatedByName: "Vet One",
    isDeleted: false,
    schemaVersion: 1,
    ...over,
  };
}

function att(over: Partial<Attivita>): Attivita {
  return {
    id: "x",
    data: new Date("2026-02-15T10:00:00Z"),
    aziendaId: "az1",
    aziendaNome: "Cascina Verdi",
    tipoId: "tp1",
    tipoNome: "Visita",
    oraria: false,
    adElemento: false,
    tariffa: 100,
    totale: 100,
    ownerUid: "vet-1",
    ownerEmail: "vet@example.com",
    ownerName: "Vet One",
    createdAt: new Date("2026-02-15T10:00:00Z"),
    updatedAt: new Date("2026-02-15T10:00:00Z"),
    isDeleted: false,
    schemaVersion: 1,
    ...over,
  };
}

interface Setup {
  repos: Repositories;
  conti: InMemoryContiRepository;
  auth: InMemoryAuthService;
}

function buildSetup(caps: Capability[]): Setup {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(actor(caps));
  const conti = new InMemoryContiRepository();
  const repos = { auth, conti } as unknown as Repositories;
  return { repos, conti, auth };
}

function withItemsInPeriod(): Attivita[] {
  // The default quarterly period for the current date — pick a date inside it.
  const { from, to } = defaultPeriodoFor(azienda());
  const mid = new Date((from.getTime() + to.getTime()) / 2);
  return [
    att({ id: "a1", data: mid, totale: 100 }),
    att({ id: "a2", data: mid, totale: 50 }),
  ];
}

describe("EmettiContoPanel", () => {
  it("renders both pro forma and Emetti buttons when user has both caps", async () => {
    const { repos } = buildSetup(["conti.proforma", "conti.emit"]);
    render(
      <EmettiContoPanel azienda={azienda()} items={withItemsInPeriod()} />,
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    expect(
      screen.getByRole("button", { name: /Salva come pro forma/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Emetti conto$/i })
    ).toBeInTheDocument();
  });

  it("hides 'Salva come pro forma' when missing conti.proforma cap", async () => {
    const { repos } = buildSetup(["conti.emit"]);
    render(
      <EmettiContoPanel azienda={azienda()} items={withItemsInPeriod()} />,
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    expect(
      screen.queryByRole("button", { name: /Salva come pro forma/i })
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /^Emetti conto$/i })
    ).toBeInTheDocument();
  });

  it("hides 'Emetti conto' button when missing conti.emit cap", async () => {
    const { repos } = buildSetup(["conti.proforma"]);
    render(
      <EmettiContoPanel azienda={azienda()} items={withItemsInPeriod()} />,
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    expect(
      screen.getByRole("button", { name: /Salva come pro forma/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Emetti conto$/i })
    ).toBeNull();
  });

  it("renders nothing when user has neither cap", () => {
    const { repos } = buildSetup([]);
    const { container } = render(
      <EmettiContoPanel azienda={azienda()} items={withItemsInPeriod()} />,
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("disables both buttons when no attivita match the period", () => {
    const { repos } = buildSetup(["conti.proforma", "conti.emit"]);
    render(
      <EmettiContoPanel azienda={azienda()} items={[]} />,
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    expect(
      screen.getByRole("button", { name: /Salva come pro forma/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /^Emetti conto$/i })
    ).toBeDisabled();
    expect(
      screen.getByText(/Nessuna attività nel periodo scelto/)
    ).toBeInTheDocument();
  });

  it("disables both buttons when the period is invalid (to before from)", () => {
    const { repos } = buildSetup(["conti.proforma", "conti.emit"]);
    render(
      <EmettiContoPanel azienda={azienda()} items={withItemsInPeriod()} />,
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    fireEvent.change(screen.getByLabelText(/^Da$/i), {
      target: { value: "2026-05-31" },
    });
    fireEvent.change(screen.getByLabelText(/^A$/i), {
      target: { value: "2026-05-01" },
    });
    expect(
      screen.getByRole("button", { name: /Salva come pro forma/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /^Emetti conto$/i })
    ).toBeDisabled();
    expect(
      screen.getByText(/Il periodo finale deve essere dopo l'iniziale/i)
    ).toBeInTheDocument();
  });

  it("uses defaultPeriodoFor(monthly) to seed the date inputs", () => {
    const { repos } = buildSetup(["conti.emit"]);
    render(
      <EmettiContoPanel
        azienda={azienda({ cadenzaFatturazione: "monthly" })}
        items={[]}
      />,
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    const expected = defaultPeriodoFor({ cadenzaFatturazione: "monthly" });
    const fromInput = screen.getByLabelText(/^Da$/i) as HTMLInputElement;
    const toInput = screen.getByLabelText(/^A$/i) as HTMLInputElement;
    expect(fromInput.value).toBe(dateInputValue(expected.from));
    expect(toInput.value).toBe(dateInputValue(expected.to));
  });

  it("renders the right total and count in the preview", () => {
    const { repos } = buildSetup(["conti.emit"]);
    render(
      <EmettiContoPanel azienda={azienda()} items={withItemsInPeriod()} />,
      { wrapper: buildProvidersWrapper({ repos }) }
    );
    // 100 + 50 = 150
    expect(screen.getByText(/Attività: 2/)).toBeInTheDocument();
    expect(screen.getByText(/150,00/)).toBeInTheDocument();
  });

  it("clicking 'Salva come pro forma' emits with modalita='proforma' without confirm", async () => {
    const { repos, conti } = buildSetup(["conti.proforma", "conti.emit"]);
    const emitSpy = vi.spyOn(conti, "emit");
    render(
      <EmettiContoPanel azienda={azienda()} items={withItemsInPeriod()} />,
      { wrapper: buildProvidersWrapper({ repos, withToast: true }) }
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Salva come pro forma/i })
    );
    await waitFor(() => expect(emitSpy).toHaveBeenCalledTimes(1));
    const [input, denorm, actorArg] = emitSpy.mock.calls[0] ?? [];
    expect(input?.modalita).toBe("proforma");
    expect(input?.aziendaId).toBe("az1");
    expect(denorm?.aziendaNome).toBe("Cascina Verdi");
    expect(denorm?.totaleConto).toBe(150);
    expect(denorm?.attivitaIds).toEqual(["a1", "a2"]);
    expect(actorArg?.uid).toBe("vet-1");
    // No confirm dialog should be visible.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("clicking 'Emetti conto' opens a confirm dialog and emits modalita='emesso' on confirm", async () => {
    const { repos, conti } = buildSetup(["conti.emit"]);
    const emitSpy = vi.spyOn(conti, "emit");
    render(
      <EmettiContoPanel azienda={azienda()} items={withItemsInPeriod()} />,
      { wrapper: buildProvidersWrapper({ repos, withToast: true }) }
    );
    fireEvent.click(screen.getByRole("button", { name: /^Emetti conto$/i }));
    // Dialog visible, emit not yet called.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Verrà registrato come conto/i)
    ).toBeInTheDocument();
    expect(emitSpy).not.toHaveBeenCalled();
    // Confirm.
    fireEvent.click(screen.getByRole("button", { name: /^Emetti$/i }));
    await waitFor(() => expect(emitSpy).toHaveBeenCalledTimes(1));
    expect(emitSpy.mock.calls[0]?.[0].modalita).toBe("emesso");
    // Dialog should close.
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("cancel on confirm dialog does not emit", async () => {
    const { repos, conti } = buildSetup(["conti.emit"]);
    const emitSpy = vi.spyOn(conti, "emit");
    render(
      <EmettiContoPanel azienda={azienda()} items={withItemsInPeriod()} />,
      { wrapper: buildProvidersWrapper({ repos, withToast: true }) }
    );
    fireEvent.click(screen.getByRole("button", { name: /^Emetti conto$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Annulla$/i }));
    expect(emitSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
