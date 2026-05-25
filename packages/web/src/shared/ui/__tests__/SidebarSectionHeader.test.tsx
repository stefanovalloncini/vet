import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarSectionHeader } from "../SidebarSectionHeader";

describe("SidebarSectionHeader", () => {
  it("renders the title as plain text when onToggle is not provided", () => {
    render(<SidebarSectionHeader title="Principale" collapsed={false} />);
    expect(screen.getByText(/Principale/i).tagName).toBe("P");
  });

  it("renders a toggle button when onToggle is provided", () => {
    render(
      <SidebarSectionHeader
        title="Admin"
        collapsed={false}
        expanded
        onToggle={() => {}}
      />
    );
    const btn = screen.getByRole("button", { name: /Admin/i });
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("sets aria-expanded='false' when expanded is false", () => {
    render(
      <SidebarSectionHeader
        title="Admin"
        collapsed={false}
        expanded={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /Admin/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("defaults aria-expanded to true when expanded is undefined", () => {
    render(
      <SidebarSectionHeader
        title="X"
        collapsed={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /X/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("fires onToggle when the button is clicked", () => {
    const onToggle = vi.fn();
    render(
      <SidebarSectionHeader
        title="X"
        collapsed={false}
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /X/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
