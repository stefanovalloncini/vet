import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { EmailLinkCompletePage } from "../EmailLinkCompletePage";
import type { Repositories } from "@vet/shared";

function mount(repos: Repositories) {
  return render(<EmailLinkCompletePage />, {
    wrapper: buildProvidersWrapper({
      repos,
      withRouter: true,
      initialEntries: ["/login/email-link?apiKey=x"],
    }),
  });
}

describe("EmailLinkCompletePage", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errSpy.mockRestore();
  });

  it("shows the error state with an alert and a back-to-login action", async () => {
    const repos = createInMemoryRepositories();
    mount(repos);
    expect(
      await screen.findByRole("heading", { level: 1, name: /Link non valido/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Torna all.?accesso/i })
    ).toHaveAttribute("href", "/login");
  });

  it("asks the user to re-enter the email when it is not remembered", async () => {
    const repos = createInMemoryRepositories();
    vi.spyOn(repos.auth, "completeEmailSignIn").mockRejectedValue(
      new Error("email not remembered")
    );
    mount(repos);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /Conferma l.?indirizzo email/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Conferma e accedi/i })
    ).toBeDisabled();
  });

  it("keeps a single h1 across the verifying and resolved states", async () => {
    const repos = createInMemoryRepositories();
    mount(repos);
    await waitFor(() => {
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    });
  });
});
