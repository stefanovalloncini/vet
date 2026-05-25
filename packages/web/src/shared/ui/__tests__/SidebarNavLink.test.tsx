import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Home } from "lucide-react";
import { describe, expect, it } from "vitest";
import { SidebarNavLink } from "../SidebarNavLink";

function wrap(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ul>{ui}</ul>
    </MemoryRouter>
  );
}

describe("SidebarNavLink", () => {
  it("renders an anchor with the correct href and label text", () => {
    wrap(
      <SidebarNavLink
        to="/agenda"
        label="Agenda"
        icon={Home}
        active={false}
        collapsed={false}
      />
    );
    const link = screen.getByRole("link", { name: /Agenda/i });
    expect(link).toHaveAttribute("href", "/agenda");
  });

  it("sets aria-current='page' when active", () => {
    wrap(
      <SidebarNavLink
        to="/x"
        label="X"
        icon={Home}
        active
        collapsed={false}
      />
    );
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
  });

  it("does not set aria-current when not active", () => {
    wrap(
      <SidebarNavLink
        to="/x"
        label="X"
        icon={Home}
        active={false}
        collapsed={false}
      />
    );
    expect(screen.getByRole("link")).not.toHaveAttribute("aria-current");
  });

  it("uses label as aria-label and title when collapsed", () => {
    wrap(
      <SidebarNavLink
        to="/x"
        label="Agenda"
        icon={Home}
        active={false}
        collapsed
      />
    );
    const link = screen.getByRole("link", { name: /Agenda/i });
    expect(link).toHaveAttribute("title", "Agenda");
    expect(link).toHaveAttribute("aria-label", "Agenda");
  });

  it("does not set title/aria-label when expanded (label is visible)", () => {
    wrap(
      <SidebarNavLink
        to="/x"
        label="Agenda"
        icon={Home}
        active={false}
        collapsed={false}
      />
    );
    const link = screen.getByRole("link", { name: /Agenda/i });
    expect(link).not.toHaveAttribute("title");
    expect(link).not.toHaveAttribute("aria-label");
  });
});
