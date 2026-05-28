import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AuditEvent } from "@vet/shared";
import { AuditRow } from "../AuditRow";

function makeEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: "evt1",
    at: new Date("2026-03-04T14:35:00"),
    actorUid: "admin-uid",
    actorEmail: "admin@vet.it",
    action: "allowlist.add",
    targetType: "allowlist",
    targetId: "mario@vet.it",
    ...overrides,
  };
}

describe("AuditRow", () => {
  it("renders the localized action label, target and actor", () => {
    render(<AuditRow event={makeEvent()} />);
    expect(screen.getByText("Email autorizzata")).toBeInTheDocument();
    expect(screen.getByText("allowlist/mario@vet.it")).toBeInTheDocument();
    expect(screen.getAllByText("admin@vet.it").length).toBeGreaterThan(0);
  });

  it("spans the full grid width", () => {
    const { container } = render(<AuditRow event={makeEvent()} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("sm:col-span-2");
    expect(root.className).toContain("lg:col-span-3");
  });

  it("falls back to the actor uid, then a dash, when email is missing", () => {
    render(<AuditRow event={makeEvent({ actorEmail: "" })} />);
    expect(screen.getAllByText("admin-uid").length).toBeGreaterThan(0);
  });

  it("shows a dash when neither actor email nor uid is present", () => {
    render(<AuditRow event={makeEvent({ actorEmail: "", actorUid: "" })} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders raw action key when no label is mapped", () => {
    render(
      <AuditRow
        event={makeEvent({ action: "totally.unknown" as AuditEvent["action"] })}
      />
    );
    expect(screen.getByText("totally.unknown")).toBeInTheDocument();
  });

  it("renders a details disclosure only when details exist", () => {
    const { rerender } = render(<AuditRow event={makeEvent()} />);
    expect(screen.queryByText(/Dettagli/i)).toBeNull();
    rerender(<AuditRow event={makeEvent({ details: { from: "vet" } })} />);
    expect(screen.getByText(/Dettagli/i)).toBeInTheDocument();
    expect(screen.getByText(/"from": "vet"/)).toBeInTheDocument();
  });
});
