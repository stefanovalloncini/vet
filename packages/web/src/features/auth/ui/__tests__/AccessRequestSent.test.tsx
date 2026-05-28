import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccessRequestSent } from "../AccessRequestSent";

describe("AccessRequestSent", () => {
  it("announces the confirmation through an aria-live status region", () => {
    render(<AccessRequestSent email="nuovo@studio.it" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/Richiesta inviata per/i);
  });

  it("shows the requested email", () => {
    render(<AccessRequestSent email="nuovo@studio.it" />);
    expect(screen.getByText("nuovo@studio.it")).toBeInTheDocument();
  });

  it("wraps a long email instead of overflowing", () => {
    const long = `${"y".repeat(90)}@studio-lombardia.example.it`;
    render(<AccessRequestSent email={long} />);
    expect(screen.getByText(long)).toHaveClass("break-all");
  });
});
