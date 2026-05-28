import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "../../../../shared/ui/Toast";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { DosaggioPage } from "../DosaggioPage";

vi.mock("../../../auth", async () => {
  const actual = await vi.importActual<typeof import("../../../auth")>(
    "../../../auth"
  );
  return {
    ...actual,
    useAuthState: () => ({
      user: {
        uid: "u1",
        email: "u1@vet.com",
        displayName: "Vet One",
        roleId: "vet",
        caps: new Set([]),
      },
      loading: false,
    }),
  };
});

function renderPage() {
  const repos = createInMemoryRepositories();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RepositoriesProvider value={repos}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/strumenti/dosaggio"]}>
            <DosaggioPage />
          </MemoryRouter>
        </ToastProvider>
      </RepositoriesProvider>
    </QueryClientProvider>
  );
}

function setField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("DosaggioPage", () => {
  it("renders exactly one h1", () => {
    renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: /Calcolatore dosaggio/i })
    ).toBeInTheDocument();
  });

  it("shows the empty result placeholder before any input", () => {
    renderPage();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("ml")).not.toBeInTheDocument();
  });

  it("computes ml and formats with an Italian decimal comma", () => {
    renderPage();
    setField(/Peso animale/i, "600");
    setField(/Dosaggio/i, "1");
    setField(/Concentrazione/i, "50");
    expect(screen.getByText("12,00")).toBeInTheDocument();
    expect(screen.getByText("ml")).toBeInTheDocument();
  });

  it("keeps the placeholder for zero or negative inputs", () => {
    renderPage();
    setField(/Peso animale/i, "0");
    setField(/Dosaggio/i, "5");
    setField(/Concentrazione/i, "50");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("does not break on very large weights", () => {
    renderPage();
    setField(/Peso animale/i, "999999999");
    setField(/Dosaggio/i, "10");
    setField(/Concentrazione/i, "50");
    expect(screen.queryByText("—")).not.toBeInTheDocument();
    expect(screen.getByText("ml")).toBeInTheDocument();
  });

  it("uses decimal input mode on the numeric fields", () => {
    renderPage();
    expect(screen.getByLabelText(/Peso animale/i)).toHaveAttribute(
      "inputmode",
      "decimal"
    );
    expect(screen.getByLabelText(/Concentrazione/i)).toHaveAttribute(
      "inputmode",
      "decimal"
    );
  });

  it("renders custom stepper buttons instead of relying on native spinners", () => {
    renderPage();
    expect(
      screen.getAllByRole("button", { name: /Aumenta/i }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Diminuisci/i }).length
    ).toBeGreaterThan(0);
  });

  it("fills dose and concentration when a preset is chosen", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/Preset/i), {
      target: { value: "ceftiofur-50" },
    });
    expect(screen.getByLabelText(/Dosaggio/i)).toHaveValue(1.1);
    expect(screen.getByLabelText(/Concentrazione/i)).toHaveValue(50);
  });

  it("shows suspension details with the special-case labels", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/Preset/i), {
      target: { value: "ivermectina-10" },
    });
    expect(screen.getByText("Via")).toBeInTheDocument();
    expect(screen.getByText("Vietato in lattazione")).toBeInTheDocument();
  });

  it("shows the leaflet disclaimer", () => {
    renderPage();
    expect(
      screen.getByText(/Verifica sempre il foglio illustrativo/i)
    ).toBeInTheDocument();
  });
});
