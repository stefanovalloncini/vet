import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../LoginPage";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import type { Repositories } from "@vet/shared";

function mountLogin(reposOverride?: Repositories) {
  const repos = reposOverride ?? createInMemoryRepositories();
  return {
    repos,
    ...render(
      <RepositoriesProvider value={repos}>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </RepositoriesProvider>
    ),
  };
}

describe("LoginPage", () => {
  it("renders email as primary, Google as secondary, and the request-access link", async () => {
    mountLogin();
    await waitFor(() => {
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /Invia magic link/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Entra con Google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Richiedi accesso/i })
    ).toBeInTheDocument();
  });

  it("switches to the access-request form when Richiedi accesso is clicked", async () => {
    mountLogin();
    fireEvent.click(
      await screen.findByRole("button", { name: /Richiedi accesso/i })
    );
    expect(await screen.findByLabelText(/Nome e cognome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Motivazione/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Invia richiesta/i })
    ).toBeInTheDocument();
  });

  it("goes back from the access-request form via Indietro", async () => {
    mountLogin();
    fireEvent.click(
      await screen.findByRole("button", { name: /Richiedi accesso/i })
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /Indietro/i })
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Invia magic link/i })
      ).toBeInTheDocument();
    });
  });

  it("shows unauthorized message and Cambia account button on allowlist denial", async () => {
    const repos = createInMemoryRepositories();
    vi.spyOn(repos.auth, "signInWithGoogle").mockRejectedValue({
      code: "auth/internal-error",
      customData: {
        _tokenResponse: { error: { message: "BLOCKING_FUNCTION_ERROR_RESPONSE" } },
      },
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mountLogin(repos);
    const googleBtn = await screen.findByRole("button", {
      name: /Entra con Google/i,
    });
    fireEvent.click(googleBtn);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/account/i);
    });
    expect(
      screen.getByRole("button", { name: /Cambia account Google/i })
    ).toBeInTheDocument();
    errSpy.mockRestore();
  });

  it("shows App Check-specific guidance when App Check token is invalid", async () => {
    const repos = createInMemoryRepositories();
    vi.spyOn(repos.auth, "signInWithGoogle").mockRejectedValue({
      code: "auth/firebase-app-check-token-is-invalid",
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mountLogin(repos);
    fireEvent.click(
      await screen.findByRole("button", { name: /Entra con Google/i })
    );
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/estensioni|browser/i);
    });
    expect(
      screen.queryByRole("button", { name: /Cambia account Google/i })
    ).toBeNull();
    errSpy.mockRestore();
  });

  it("re-invokes signInWithGoogle with selectAccount when Cambia account is clicked", async () => {
    const repos = createInMemoryRepositories();
    const spy = vi.spyOn(repos.auth, "signInWithGoogle").mockRejectedValue({
      code: "auth/admin-restricted-operation",
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mountLogin(repos);
    fireEvent.click(
      await screen.findByRole("button", { name: /Entra con Google/i })
    );
    const switchBtn = await screen.findByRole("button", {
      name: /Cambia account Google/i,
    });
    fireEvent.click(switchBtn);
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ selectAccount: true });
    });
    errSpy.mockRestore();
  });

  it("does not show error for a user-cancelled popup", async () => {
    const repos = createInMemoryRepositories();
    vi.spyOn(repos.auth, "signInWithGoogle").mockRejectedValue({
      code: "auth/popup-closed-by-user",
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mountLogin(repos);
    fireEvent.click(
      await screen.findByRole("button", { name: /Entra con Google/i })
    );
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.queryByRole("alert")).toBeNull();
    errSpy.mockRestore();
  });

  it("shows confirmation panel after a successful email link send", async () => {
    const repos = createInMemoryRepositories();
    vi.spyOn(repos.auth, "sendEmailSignInLink").mockResolvedValue();
    mountLogin(repos);
    fireEvent.change(await screen.findByLabelText(/Email/i), {
      target: { value: "tester@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Invia magic link/i }));
    await waitFor(() => {
      expect(screen.getByText(/Controlla la tua email/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/tester@example\.com/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Invia di nuovo/i })
    ).toBeInTheDocument();
  });

  it("submits the access-request form and shows the confirmation message", async () => {
    const repos = createInMemoryRepositories();
    const spy = vi
      .spyOn(repos.auth, "sendEmailSignInLink")
      .mockResolvedValue();
    mountLogin(repos);
    fireEvent.click(
      await screen.findByRole("button", { name: /Richiedi accesso/i })
    );
    fireEvent.change(await screen.findByLabelText(/Email/i), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Nome e cognome/i), {
      target: { value: "Mario Rossi" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Invia richiesta/i }));
    await waitFor(() => {
      expect(screen.getByText(/Richiesta inviata per/i)).toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("new@example.com");
    expect(screen.getByText(/new@example\.com/)).toBeInTheDocument();
  });
});
