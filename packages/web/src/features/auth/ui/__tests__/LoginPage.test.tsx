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
  it("renders Google button and email form", async () => {
    mountLogin();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Continua con Google/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inviami il link/i })).toBeInTheDocument();
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
    const googleBtn = await screen.findByRole("button", { name: /Continua con Google/i });
    fireEvent.click(googleBtn);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/account/i);
    });
    expect(screen.getByRole("button", { name: /Cambia account Google/i })).toBeInTheDocument();
    errSpy.mockRestore();
  });

  it("shows App Check-specific guidance when App Check token is invalid", async () => {
    const repos = createInMemoryRepositories();
    vi.spyOn(repos.auth, "signInWithGoogle").mockRejectedValue({
      code: "auth/firebase-app-check-token-is-invalid",
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mountLogin(repos);
    fireEvent.click(await screen.findByRole("button", { name: /Continua con Google/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/estensioni|browser/i);
    });
    expect(screen.queryByRole("button", { name: /Cambia account Google/i })).toBeNull();
    errSpy.mockRestore();
  });

  it("re-invokes signInWithGoogle with selectAccount when Cambia account is clicked", async () => {
    const repos = createInMemoryRepositories();
    const spy = vi.spyOn(repos.auth, "signInWithGoogle").mockRejectedValue({
      code: "auth/admin-restricted-operation",
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mountLogin(repos);
    fireEvent.click(await screen.findByRole("button", { name: /Continua con Google/i }));
    const switchBtn = await screen.findByRole("button", { name: /Cambia account Google/i });
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
    fireEvent.click(await screen.findByRole("button", { name: /Continua con Google/i }));
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.queryByRole("alert")).toBeNull();
    errSpy.mockRestore();
  });

  it("shows confirmation card after a successful email link send", async () => {
    const repos = createInMemoryRepositories();
    vi.spyOn(repos.auth, "sendEmailSignInLink").mockResolvedValue();
    mountLogin(repos);
    const emailField = await screen.findByLabelText(/Email/i);
    fireEvent.change(emailField, { target: { value: "tester@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Inviami il link/i }));
    await waitFor(() => {
      expect(screen.getByText(/Controlla la tua email/i)).toBeInTheDocument();
    });
  });
});
