import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BoxedList } from "../BoxedList";

describe("BoxedList", () => {
  it("renders a UL with children", () => {
    render(
      <BoxedList>
        <li>uno</li>
        <li>due</li>
      </BoxedList>
    );
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(list.children).toHaveLength(2);
  });

  it("merges custom className with the default classes", () => {
    render(
      <BoxedList className="extra-class">
        <li>x</li>
      </BoxedList>
    );
    const list = screen.getByRole("list");
    expect(list.className).toContain("extra-class");
    expect(list.className).toContain("rounded-2xl");
  });

  it("forwards extra HTML attributes (aria-label, id)", () => {
    render(
      <BoxedList aria-label="elenco voci" id="my-list">
        <li>x</li>
      </BoxedList>
    );
    const list = screen.getByRole("list", { name: /elenco voci/i });
    expect(list).toHaveAttribute("id", "my-list");
  });
});
