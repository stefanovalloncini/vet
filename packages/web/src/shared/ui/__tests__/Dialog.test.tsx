import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";

describe("Dialog", () => {
  it("renders nothing when open=false", () => {
    const { container } = render(
      <Dialog open={false} onClose={() => {}}>
        <p>Contenuto</p>
      </Dialog>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog and children when open=true", () => {
    render(
      <Dialog open onClose={() => {}}>
        <p>Contenuto</p>
      </Dialog>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Contenuto")).toBeInTheDocument();
  });

  it("has aria-modal=true and supports labelledBy/describedBy", () => {
    render(
      <Dialog open onClose={() => {}} labelledBy="t" describedBy="d">
        <h2 id="t">Titolo</h2>
        <p id="d">Descrizione</p>
      </Dialog>
    );
    const dlg = screen.getByRole("dialog");
    expect(dlg).toHaveAttribute("aria-modal", "true");
    expect(dlg).toHaveAttribute("aria-labelledby", "t");
    expect(dlg).toHaveAttribute("aria-describedby", "d");
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <p>x</p>
      </Dialog>
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking outside the surface", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <p>inside</p>
      </Dialog>
    );
    const backdrop = screen.getByRole("dialog");
    fireEvent.pointerDown(backdrop);
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside content", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <button type="button">inside</button>
      </Dialog>
    );
    const inside = screen.getByRole("button", { name: "inside" });
    fireEvent.pointerDown(inside);
    fireEvent.click(inside);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not call onClose when drag starts inside surface and ends on backdrop", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <button type="button">inside</button>
      </Dialog>
    );
    const inside = screen.getByRole("button", { name: "inside" });
    const backdrop = screen.getByRole("dialog");
    fireEvent.pointerDown(inside);
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("focuses the first focusable element on open", () => {
    render(
      <Dialog open onClose={() => {}}>
        <button type="button">first</button>
        <button type="button">second</button>
      </Dialog>
    );
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "first" }));
  });
});
