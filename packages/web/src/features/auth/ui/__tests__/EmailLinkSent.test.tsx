import { fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmailLinkSent } from "../EmailLinkSent";

describe("EmailLinkSent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces the sent state through an aria-live status region", () => {
    render(
      <EmailLinkSent email="vet@studio.it" busy={false} onResend={vi.fn()} />
    );
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/Controlla la tua email/i);
  });

  it("shows the destination email", () => {
    render(
      <EmailLinkSent email="vet@studio.it" busy={false} onResend={vi.fn()} />
    );
    expect(screen.getByText("vet@studio.it")).toBeInTheDocument();
  });

  function runCooldown() {
    for (let i = 0; i < 30; i += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
  }

  it("keeps resend disabled during the cooldown then enables it", () => {
    render(<EmailLinkSent email="vet@studio.it" busy={false} onResend={vi.fn()} />);
    const resend = screen.getByRole("button", { name: /Invia di nuovo/i });
    expect(resend).toBeDisabled();
    expect(screen.getByText(/tra \d+s/)).toBeInTheDocument();
    runCooldown();
    expect(resend).toBeEnabled();
    expect(screen.queryByText(/tra \d+s/)).not.toBeInTheDocument();
  });

  it("invokes onResend once the cooldown clears", () => {
    const onResend = vi.fn().mockResolvedValue(undefined);
    render(<EmailLinkSent email="vet@studio.it" busy={false} onResend={onResend} />);
    runCooldown();
    fireEvent.click(screen.getByRole("button", { name: /Invia di nuovo/i }));
    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it("wraps a long email instead of overflowing", () => {
    const long = `${"x".repeat(90)}@studio-lombardia.example.it`;
    render(<EmailLinkSent email={long} busy={false} onResend={vi.fn()} />);
    expect(screen.getByText(long)).toHaveClass("break-all");
  });
});
