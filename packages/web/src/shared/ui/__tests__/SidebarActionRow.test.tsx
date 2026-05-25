import { fireEvent, render, screen } from "@testing-library/react";
import { Settings } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { SidebarActionRow } from "../SidebarActionRow";

describe("SidebarActionRow", () => {
  it("renders a button with the label as accessible name", () => {
    render(
      <SidebarActionRow
        onClick={() => {}}
        icon={Settings}
        label="Impostazioni"
        collapsed={false}
      />
    );
    expect(
      screen.getByRole("button", { name: /Impostazioni/i })
    ).toBeInTheDocument();
  });

  it("fires onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <SidebarActionRow
        onClick={onClick}
        icon={Settings}
        label="X"
        collapsed={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /X/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses label as title only when collapsed", () => {
    const { rerender } = render(
      <SidebarActionRow
        onClick={() => {}}
        icon={Settings}
        label="X"
        collapsed
      />
    );
    expect(screen.getByRole("button")).toHaveAttribute("title", "X");
    rerender(
      <SidebarActionRow
        onClick={() => {}}
        icon={Settings}
        label="X"
        collapsed={false}
      />
    );
    expect(screen.getByRole("button")).not.toHaveAttribute("title");
  });

  it("forwards ariaKeyshortcuts to the button", () => {
    render(
      <SidebarActionRow
        onClick={() => {}}
        icon={Settings}
        label="Cerca"
        collapsed={false}
        ariaKeyshortcuts="Meta+K Control+K"
      />
    );
    expect(screen.getByRole("button", { name: /Cerca/i })).toHaveAttribute(
      "aria-keyshortcuts",
      "Meta+K Control+K"
    );
  });

  it("omits aria-keyshortcuts when ariaKeyshortcuts is not provided", () => {
    render(
      <SidebarActionRow
        onClick={() => {}}
        icon={Settings}
        label="X"
        collapsed={false}
      />
    );
    expect(
      screen.getByRole("button", { name: /X/i })
    ).not.toHaveAttribute("aria-keyshortcuts");
  });
});
