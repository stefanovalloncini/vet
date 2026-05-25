import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "../IconButton";

describe("IconButton", () => {
  it("uses the label as accessible name and title", () => {
    render(
      <IconButton
        label="Chiudi"
        onClick={() => {}}
        icon={<span data-testid="icon">x</span>}
      />
    );
    const btn = screen.getByRole("button", { name: /Chiudi/i });
    expect(btn).toHaveAttribute("title", "Chiudi");
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("fires onClick when clicked", () => {
    const onClick = vi.fn();
    render(<IconButton label="Apri" onClick={onClick} icon={<span>i</span>} />);
    fireEvent.click(screen.getByRole("button", { name: /Apri/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <IconButton
        label="Apri"
        onClick={onClick}
        icon={<span>i</span>}
        disabled
      />
    );
    const btn = screen.getByRole("button", { name: /Apri/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies smaller sizing when size='sm'", () => {
    render(
      <IconButton
        label="Compatto"
        onClick={() => {}}
        icon={<span>i</span>}
        size="sm"
      />
    );
    const btn = screen.getByRole("button", { name: /Compatto/i });
    expect(btn.className).toMatch(/h-9 w-9/);
  });

  it("applies medium sizing by default", () => {
    render(
      <IconButton label="Default" onClick={() => {}} icon={<span>i</span>} />
    );
    const btn = screen.getByRole("button", { name: /Default/i });
    expect(btn.className).toMatch(/h-11 w-11/);
  });
});
