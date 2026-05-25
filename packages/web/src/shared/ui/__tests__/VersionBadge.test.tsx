import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VersionBadge } from "../VersionBadge";

describe("VersionBadge", () => {
  it("renders the version SHA and build date", () => {
    render(<VersionBadge />);
    expect(screen.getByText(/vtest/i)).toBeInTheDocument();
  });

  it("prepends the email when provided", () => {
    render(<VersionBadge email="vet@example.com" />);
    expect(screen.getByText(/vet@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/vtest/i)).toBeInTheDocument();
  });

  it("ignores null/undefined email", () => {
    const { rerender } = render(<VersionBadge email={null} />);
    expect(screen.queryByText(/null/)).toBeNull();
    rerender(<VersionBadge email={undefined} />);
    expect(screen.queryByText(/undefined/)).toBeNull();
  });

  it("renders a tooltip via title attribute", () => {
    render(<VersionBadge />);
    const p = screen.getByText(/vtest/i);
    expect(p).toHaveAttribute("title");
    expect(p.getAttribute("title")).toMatch(/branch/);
  });
});
