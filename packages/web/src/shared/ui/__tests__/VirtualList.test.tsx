import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VirtualList } from "../VirtualList";

describe("VirtualList", () => {
  it("renders only the visible window of rows for a large list", () => {
    const items = Array.from({ length: 1000 }, (_, i) => `item-${i}`);
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={40}
        height={400}
        renderItem={(item) => <span>{item}</span>}
      />
    );
    const rendered = container.querySelectorAll('[role="listitem"]');
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(50);
    expect(screen.getByText("item-0")).toBeInTheDocument();
    expect(screen.queryByText("item-999")).not.toBeInTheDocument();
  });

  it("renders the empty state when items is empty", () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={40}
        height={400}
        renderItem={(item: string) => <span>{item}</span>}
        emptyState={<p>Nessun elemento</p>}
      />
    );
    expect(screen.getByText("Nessun elemento")).toBeInTheDocument();
  });

  it("renders nothing when items is empty and no emptyState provided", () => {
    const { container } = render(
      <VirtualList
        items={[]}
        itemHeight={40}
        height={400}
        renderItem={(item: string) => <span>{item}</span>}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
