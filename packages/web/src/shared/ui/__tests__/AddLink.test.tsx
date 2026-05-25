import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddLink } from "../AddLink";

describe("AddLink", () => {
  it("renders a button with the given label", () => {
    render(<AddLink onClick={() => {}} label="+ Nuova" />);
    expect(
      screen.getByRole("button", { name: /\+ Nuova/i })
    ).toBeInTheDocument();
  });

  it("uses type='button' (not submit)", () => {
    render(<AddLink onClick={() => {}} label="x" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("fires onClick on click", () => {
    const onClick = vi.fn();
    render(<AddLink onClick={onClick} label="Nuovo" />);
    fireEvent.click(screen.getByRole("button", { name: /Nuovo/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
