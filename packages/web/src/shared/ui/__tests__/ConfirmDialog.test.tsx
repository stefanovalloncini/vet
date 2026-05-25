import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders nothing when open is false", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Eliminare?"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.queryByRole("heading", { name: /Eliminare/i })).toBeNull();
  });

  it("renders title and default labels when open", () => {
    render(
      <ConfirmDialog
        open
        title="Eliminare la voce?"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByRole("heading", { name: /Eliminare la voce/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Conferma/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Annulla/i })).toBeInTheDocument();
  });

  it("renders the message under the title", () => {
    render(
      <ConfirmDialog
        open
        title="OK?"
        message="Sicuro di voler procedere?"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Sicuro di voler procedere/i)).toBeInTheDocument();
  });

  it("fires onConfirm when the confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="OK?"
        confirmLabel="Procedi"
        onConfirm={onConfirm}
        onClose={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Procedi/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("fires onClose when the cancel button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        title="OK?"
        cancelLabel="Indietro"
        onConfirm={() => {}}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Indietro/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons while busy", () => {
    render(
      <ConfirmDialog
        open
        title="OK?"
        busy
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /Conferma/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Annulla/i })).toBeDisabled();
  });
});
