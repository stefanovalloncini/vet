import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../Button";

describe("Button", () => {
  it("renders children as label", () => {
    render(<Button>Salva</Button>);
    expect(screen.getByRole("button", { name: "Salva" })).toBeInTheDocument();
  });

  it("calls onClick on click", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Avanti</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Avanti" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies primary teal background by default", () => {
    render(<Button>Default</Button>);
    expect(screen.getByRole("button").className).toContain("bg-(--color-accent)");
  });

  it("applies secondary variant", () => {
    render(<Button variant="secondary">B</Button>);
    expect(screen.getByRole("button").className).toContain("border-(--color-border)");
  });

  it("applies ghost variant with no background", () => {
    render(<Button variant="ghost">B</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("text-(--color-text-muted)");
    expect(cls).not.toContain("bg-(--color-accent)");
  });

  it("applies danger variant with danger color", () => {
    render(<Button variant="danger">B</Button>);
    expect(screen.getByRole("button").className).toContain("bg-(--color-danger)");
  });

  it("md size renders 44px touch target", () => {
    render(<Button size="md">B</Button>);
    expect(screen.getByRole("button").className).toContain("h-11");
  });

  it("sm size renders 36px target", () => {
    render(<Button size="sm">B</Button>);
    expect(screen.getByRole("button").className).toContain("h-9");
  });

  it("lg size renders 52px target", () => {
    render(<Button size="lg">B</Button>);
    expect(screen.getByRole("button").className).toContain("h-13");
  });

  it("renders disabled and ignores click", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        D
      </Button>
    );
    const btn = screen.getByRole("button", { name: "D" });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies fullWidth class when fullWidth=true", () => {
    render(<Button fullWidth>F</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("renders leading and trailing icons alongside the label", () => {
    render(
      <Button leadingIcon={<span data-testid="lead">L</span>} trailingIcon={<span data-testid="trail">T</span>}>
        Hi
      </Button>
    );
    expect(screen.getByTestId("lead")).toBeInTheDocument();
    expect(screen.getByTestId("trail")).toBeInTheDocument();
    expect(screen.getByRole("button").textContent).toBe("LHiT");
  });
});
