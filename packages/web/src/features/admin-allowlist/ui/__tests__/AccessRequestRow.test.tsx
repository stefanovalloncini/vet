import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AccessRequest } from "@vet/shared";
import { AccessRequestRow } from "../AccessRequestRow";

function makeRequest(overrides: Partial<AccessRequest> = {}): AccessRequest {
  return {
    emailNorm: "asker@vet.it",
    email: "asker@vet.it",
    firstAttemptAt: new Date("2026-01-01T10:00:00Z"),
    lastAttemptAt: new Date("2026-01-02T10:00:00Z"),
    attempts: 2,
    schemaVersion: 1,
    ...overrides,
  };
}

describe("AccessRequestRow", () => {
  it("renders the email, status badge and attempt meta", () => {
    render(
      <AccessRequestRow
        request={makeRequest()}
        busy={false}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText("asker@vet.it")).toBeInTheDocument();
    expect(screen.getByText("Richiesta")).toBeInTheDocument();
    expect(screen.getByText(/2 tentativi/i)).toBeInTheDocument();
  });

  it("spans the full grid width so columns do not overlap", () => {
    const { container } = render(
      <AccessRequestRow
        request={makeRequest()}
        busy={false}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("sm:col-span-2");
    expect(root.className).toContain("lg:col-span-3");
  });

  it("exposes accept and reject controls with email-scoped labels", () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    render(
      <AccessRequestRow
        request={makeRequest()}
        busy={false}
        onAccept={onAccept}
        onReject={onReject}
      />
    );
    screen.getByRole("button", { name: /Aggiungi asker@vet\.it/i }).click();
    screen.getByRole("button", { name: /Rifiuta asker@vet\.it/i }).click();
    expect(onAccept).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledOnce();
  });

  it("shows the provider label when present", () => {
    render(
      <AccessRequestRow
        request={makeRequest({ providerId: "google.com" })}
        busy={false}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText(/via Google/i)).toBeInTheDocument();
  });

  it("disables both actions while busy", () => {
    render(
      <AccessRequestRow
        request={makeRequest()}
        busy
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );
    for (const btn of screen.getAllByRole("button")) {
      expect(btn).toBeDisabled();
    }
  });
});
