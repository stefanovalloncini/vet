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
    const badge = screen.getByText(/vtest/i).closest("[title]");
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute("title")).toMatch(/branch/);
  });
});
