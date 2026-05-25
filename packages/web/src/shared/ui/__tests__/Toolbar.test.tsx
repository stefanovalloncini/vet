import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toolbar } from "../Toolbar";

describe("Toolbar", () => {
  it("renders children", () => {
    render(
      <Toolbar>
        <button type="button">A</button>
        <button type="button">B</button>
      </Toolbar>
    );
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "B" })).toBeInTheDocument();
  });

  it("declares role=toolbar by default", () => {
    render(
      <Toolbar>
        <span>x</span>
      </Toolbar>
    );
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("applies default md gap and start align", () => {
    render(
      <Toolbar>
        <span>x</span>
      </Toolbar>
    );
    const t = screen.getByRole("toolbar");
    expect(t.className).toContain("gap-3");
    expect(t.className).toContain("justify-start");
  });

  it("supports between alignment", () => {
    render(
      <Toolbar align="between">
        <span>x</span>
      </Toolbar>
    );
    expect(screen.getByRole("toolbar").className).toContain("justify-between");
  });

  it("supports sm/lg gap", () => {
    const { rerender } = render(
      <Toolbar gap="sm">
        <span>x</span>
      </Toolbar>
    );
    expect(screen.getByRole("toolbar").className).toContain("gap-2");
    rerender(
      <Toolbar gap="lg">
        <span>x</span>
      </Toolbar>
    );
    expect(screen.getByRole("toolbar").className).toContain("gap-4");
  });

  it("renders vertical when vertical=true", () => {
    render(
      <Toolbar vertical>
        <span>x</span>
      </Toolbar>
    );
    expect(screen.getByRole("toolbar").className).toContain("flex-col");
  });

  it("disables wrap when wrap=false", () => {
    render(
      <Toolbar wrap={false}>
        <span>x</span>
      </Toolbar>
    );
    expect(screen.getByRole("toolbar").className).toContain("flex-nowrap");
  });
});
