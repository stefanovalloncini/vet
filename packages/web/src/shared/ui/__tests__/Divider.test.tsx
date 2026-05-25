import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Divider } from "../Divider";

describe("Divider", () => {
  it("renders an HR when no children are provided", () => {
    const { container } = render(<Divider />);
    const hr = container.querySelector("hr");
    expect(hr).not.toBeNull();
  });

  it("merges className on the HR variant", () => {
    const { container } = render(<Divider className="mt-4" />);
    const hr = container.querySelector("hr");
    expect(hr?.className).toContain("mt-4");
  });

  it("renders the text variant with children between two lines", () => {
    render(<Divider>oppure</Divider>);
    expect(screen.getByText(/oppure/i)).toBeInTheDocument();
  });

  it("uppercase styling applied to text variant", () => {
    render(<Divider>label</Divider>);
    const span = screen.getByText(/label/i);
    expect(span.className).toContain("uppercase");
  });
});
