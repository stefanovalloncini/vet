import { describe, expect, it } from "vitest";
import { withAllOption } from "../options";

describe("withAllOption", () => {
  it("prepends a sentinel option with empty value", () => {
    const out = withAllOption([{ value: "a", label: "A" }], "Tutti");
    expect(out).toEqual([
      { value: "", label: "Tutti" },
      { value: "a", label: "A" },
    ]);
  });

  it("returns a new list (does not mutate input)", () => {
    const input = [{ value: "x", label: "X" }];
    const out = withAllOption(input, "All");
    expect(out).not.toBe(input);
    expect(input).toHaveLength(1);
  });

  it("handles empty input list", () => {
    expect(withAllOption([], "Tutti")).toEqual([{ value: "", label: "Tutti" }]);
  });

  it("preserves order of original items", () => {
    const items = [
      { value: "1", label: "One" },
      { value: "2", label: "Two" },
      { value: "3", label: "Three" },
    ];
    const out = withAllOption(items, "All");
    expect(out.slice(1).map((o) => o.value)).toEqual(["1", "2", "3"]);
  });
});
