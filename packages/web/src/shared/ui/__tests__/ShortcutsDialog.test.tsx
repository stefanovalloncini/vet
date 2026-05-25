import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShortcutsDialog, SHORTCUTS_OPEN_EVENT } from "../ShortcutsDialog";

describe("ShortcutsDialog", () => {
  it("opens when the global event is dispatched", async () => {
    render(<ShortcutsDialog />);
    act(() => {
      window.dispatchEvent(new CustomEvent(SHORTCUTS_OPEN_EVENT));
    });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Scorciatoie da tastiera/i })
      ).toBeInTheDocument()
    );
  });

  it("opens when the user presses ?", async () => {
    render(<ShortcutsDialog />);
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Scorciatoie da tastiera/i })
      ).toBeInTheDocument()
    );
  });

  it("does NOT open when ? is pressed while typing in an input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    render(<ShortcutsDialog />);
    fireEvent.keyDown(input, { key: "?" });
    expect(
      screen.queryByRole("heading", { name: /Scorciatoie da tastiera/i })
    ).toBeNull();
    document.body.removeChild(input);
  });

  it("does NOT open when ? is pressed with a modifier", () => {
    render(<ShortcutsDialog />);
    fireEvent.keyDown(window, { key: "?", metaKey: true });
    expect(
      screen.queryByRole("heading", { name: /Scorciatoie da tastiera/i })
    ).toBeNull();
    fireEvent.keyDown(window, { key: "?", ctrlKey: true });
    expect(
      screen.queryByRole("heading", { name: /Scorciatoie da tastiera/i })
    ).toBeNull();
  });

  it("renders the documented shortcuts (search, help, escape)", async () => {
    render(<ShortcutsDialog />);
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });
    await waitFor(() =>
      expect(screen.getByText(/Apri la ricerca rapida/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Mostra questa lista/i)).toBeInTheDocument();
    expect(screen.getByText(/Chiudi dialoghi e popup/i)).toBeInTheDocument();
  });
});
