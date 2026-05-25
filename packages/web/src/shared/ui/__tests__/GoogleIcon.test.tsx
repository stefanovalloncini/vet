import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GoogleIcon } from "../GoogleIcon";

describe("GoogleIcon", () => {
  it("renders an SVG marked as aria-hidden", () => {
    const { container } = render(<GoogleIcon />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies the default className 'size-5' when not overridden", () => {
    const { container } = render(<GoogleIcon />);
    expect(container.querySelector("svg")?.getAttribute("class")).toBe("size-5");
  });

  it("respects a custom className", () => {
    const { container } = render(<GoogleIcon className="size-8 mx-2" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toBe(
      "size-8 mx-2"
    );
  });

  it("renders the four colored paths of the Google logo", () => {
    const { container } = render(<GoogleIcon />);
    expect(container.querySelectorAll("path")).toHaveLength(4);
  });
});
