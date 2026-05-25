import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingDialog } from "../OnboardingDialog";

describe("OnboardingDialog", () => {
  it("greets the user by first name on step 1", () => {
    render(
      <OnboardingDialog
        open
        displayName="Mario Rossi"
        onClose={vi.fn()}
        onStartFirstEntry={vi.fn()}
      />
    );
    expect(screen.getByText(/Benvenuto, Mario\./i)).toBeInTheDocument();
  });

  it("falls back to a generic greeting when displayName is empty", () => {
    render(
      <OnboardingDialog
        open
        displayName=""
        onClose={vi.fn()}
        onStartFirstEntry={vi.fn()}
      />
    );
    expect(screen.getByText(/^Benvenuto\.$/i)).toBeInTheDocument();
  });

  it("advances to step 2 on Avanti and shows the quick-entry CTA", () => {
    render(
      <OnboardingDialog
        open
        displayName="Mario"
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
        displayName="Mario"
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
        displayName="Mario"
        onClose={onClose}
        onStartFirstEntry={onStart}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Salta/i }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });
});
