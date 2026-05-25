import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "../Tabs";

type Tab = "one" | "two" | "three";
const items = [
  { value: "one" as Tab, label: "Uno" },
  { value: "two" as Tab, label: "Due" },
  { value: "three" as Tab, label: "Tre" },
];

describe("Tabs", () => {
  it("renders all tabs with role tab and aria-selected on the active one", () => {
    render(<Tabs items={items} value="two" onChange={() => {}} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
  });

  it("fires onChange with the clicked tab's value", () => {
    const onChange = vi.fn();
    render(<Tabs items={items} value="one" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Tre" }));
    expect(onChange).toHaveBeenCalledWith("three");
  });

  it("does not fire onChange for disabled tabs (button-disabled blocks click)", () => {
    const onChange = vi.fn();
    render(
      <Tabs
        items={[
          { value: "one" as Tab, label: "Uno" },
          { value: "two" as Tab, label: "Due", disabled: true },
        ]}
        value="one"
        onChange={onChange}
      />
    );
    const due = screen.getByRole("tab", { name: "Due" });
    expect(due).toBeDisabled();
    fireEvent.click(due);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders a badge next to the tab label when provided", () => {
    render(
      <Tabs
        items={[
          { value: "one" as Tab, label: "Uno", badge: 5 },
          { value: "two" as Tab, label: "Due" },
        ]}
        value="one"
        onChange={() => {}}
      />
    );
    const tab = screen.getByRole("tab", { name: /Uno/i });
    expect(tab.textContent).toContain("5");
  });

  it("uses tablist role with optional aria-label", () => {
    render(
      <Tabs
        items={items}
        value="one"
        onChange={() => {}}
        label="Sezioni"
      />
    );
    const list = screen.getByRole("tablist");
    expect(list).toHaveAttribute("aria-label", "Sezioni");
  });
});
