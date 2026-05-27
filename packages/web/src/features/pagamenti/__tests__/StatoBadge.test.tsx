import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatoBadge } from "../ui/StatoBadge";

describe("StatoBadge", () => {
  it("renders the saldato label for ok status", () => {
    render(<StatoBadge status="ok" />);
    expect(screen.getByText("Saldato")).toBeInTheDocument();
  });

  it("renders the non saldato label for unpaid status", () => {
    render(<StatoBadge status="unpaid" />);
    expect(screen.getByText("Non saldato")).toBeInTheDocument();
  });

  it("renders the da emettere label for todo status", () => {
    render(<StatoBadge status="todo" />);
    expect(screen.getByText("Da emettere")).toBeInTheDocument();
  });
});
