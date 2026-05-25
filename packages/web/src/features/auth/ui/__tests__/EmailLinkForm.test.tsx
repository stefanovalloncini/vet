import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailLinkForm } from "../EmailLinkForm";

describe("EmailLinkForm", () => {
  it("rejects invalid email with a field-level error", async () => {
    const onSubmit = vi.fn();
    render(<EmailLinkForm busy={false} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Invia magic link/i }));
    expect(
      await screen.findByText(/Inserisci un indirizzo email valido/i)
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits parsed values when email is valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EmailLinkForm busy={false} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "vet@studio.it" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Invia magic link/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ email: "vet@studio.it" });
  });

  it("disables everything while busy", () => {
    render(
      <EmailLinkForm
        defaultEmail="user@example.com"
        busy={true}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/Email/i)).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Invio in corso/i })
    ).toBeDisabled();
  });

  it("respects defaultEmail prop", () => {
    render(
      <EmailLinkForm
        defaultEmail="prefill@example.com"
        busy={false}
        onSubmit={vi.fn()}
      />
    );
    expect(
      (screen.getByLabelText(/Email/i) as HTMLInputElement).value
    ).toBe("prefill@example.com");
  });

  it("calls onEmailChange as the user types", async () => {
    const onEmailChange = vi.fn();
    render(
      <EmailLinkForm
        busy={false}
        onSubmit={vi.fn()}
        onEmailChange={onEmailChange}
      />
    );
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "draft@example.com" },
    });
    await waitFor(() => {
      expect(onEmailChange).toHaveBeenCalledWith("draft@example.com");
    });
  });
});
