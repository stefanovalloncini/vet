import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingDialog } from "../OnboardingDialog";

describe("OnboardingDialog", () => {
  it("shows the welcome step on first render", () => {
    render(
      <OnboardingDialog
        open
        onClose={vi.fn()}
        onStartFirstEntry={vi.fn()}
      />
    );
    expect(screen.getByText(/Pronto a iniziare/i)).toBeInTheDocument();
  });

  it("advances to step 2 on Avanti and shows the quick-entry CTA", () => {
    render(
      <OnboardingDialog
        open
        onClose={vi.fn()}
        onStartFirstEntry={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Avanti/i }));
    expect(
      screen.getByText(/Aggiungi la tua prima attività/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Inizia/i })
    ).toBeInTheDocument();
  });

  it("calls onStartFirstEntry and closes on Inizia", () => {
    const onClose = vi.fn();
    const onStart = vi.fn();
    render(
      <OnboardingDialog
        open
        onClose={onClose}
        onStartFirstEntry={onStart}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Avanti/i }));
    fireEvent.click(screen.getByRole("button", { name: /Inizia/i }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("dismisses without starting entry when Salta is clicked", () => {
    const onClose = vi.fn();
    const onStart = vi.fn();
    render(
      <OnboardingDialog
        open
        onClose={onClose}
        onStartFirstEntry={onStart}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Salta/i }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });
});
