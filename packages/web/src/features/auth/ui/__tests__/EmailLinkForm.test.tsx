import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailLinkForm } from "../EmailLinkForm";

describe("EmailLinkForm", () => {
  it("disables submit while email is empty and fires submit when filled", () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    const onEmailChange = vi.fn();
    const { rerender } = render(
      <EmailLinkForm
        email=""
        busy={false}
        onEmailChange={onEmailChange}
        onSubmit={onSubmit}
        onBack={() => {}}
      />
    );
    const submit = screen.getByRole("button", { name: /Inviami il link/i });
    expect(submit).toBeDisabled();
    rerender(
      <EmailLinkForm
        email="user@example.com"
        busy={false}
        onEmailChange={onEmailChange}
        onSubmit={onSubmit}
        onBack={() => {}}
      />
    );
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("calls onBack when Indietro is clicked", () => {
    const onBack = vi.fn();
    render(
      <EmailLinkForm
        email=""
        busy={false}
        onEmailChange={() => {}}
        onSubmit={(e) => e.preventDefault()}
        onBack={onBack}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Indietro/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("disables everything while busy", () => {
    render(
      <EmailLinkForm
        email="user@example.com"
        busy={true}
        onEmailChange={() => {}}
        onSubmit={(e) => e.preventDefault()}
        onBack={() => {}}
      />
    );
    expect(screen.getByLabelText(/Email/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Invio in corso/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Indietro/i })).toBeDisabled();
  });
});
