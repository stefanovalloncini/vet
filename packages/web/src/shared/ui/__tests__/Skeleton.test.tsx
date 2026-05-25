import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardSkeleton, ListSkeleton, Skeleton } from "../Skeleton";

describe("Skeleton", () => {
  it("renders a div with animate-pulse class", () => {
    const { container } = render(<Skeleton />);
    const div = container.querySelector("div");
    expect(div?.className).toContain("animate-pulse");
  });

  it("merges custom className", () => {
    const { container } = render(<Skeleton className="h-4 w-16" />);
    expect(container.querySelector("div")?.className).toContain("h-4");
  });
});

describe("CardSkeleton", () => {
  it("renders one row by default plus the title row", () => {
    const { container } = render(<CardSkeleton />);
    // 1 title + 1 row = 2 skeleton blocks
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(2);
  });

  it("renders the requested number of rows", () => {
    const { container } = render(<CardSkeleton rows={5} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6);
  });
});

describe("ListSkeleton", () => {
  it("renders the requested count of card skeletons in a UL", () => {
    const { container } = render(<ListSkeleton count={4} />);
    expect(container.querySelectorAll("li")).toHaveLength(4);
    expect(container.querySelector("ul")).not.toBeNull();
  });

  it("defaults to 3 cards", () => {
    const { container } = render(<ListSkeleton />);
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });
});
