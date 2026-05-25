import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataLoader } from "../DataLoader";

describe("DataLoader", () => {
  it("shows the default skeleton when loading", () => {
    render(
      <DataLoader loading error={null}>
        <p>Content</p>
      </DataLoader>
    );
    expect(screen.queryByText(/Content/i)).toBeNull();
  });

  it("shows a custom skeleton when provided", () => {
    render(
      <DataLoader loading error={null} skeleton={<p>LOADING-CUSTOM</p>}>
        <p>Content</p>
      </DataLoader>
    );
    expect(screen.getByText(/LOADING-CUSTOM/i)).toBeInTheDocument();
  });

  it("shows the error block with role=alert when error is set", () => {
    render(
      <DataLoader loading={false} error="Boom">
        <p>Content</p>
      </DataLoader>
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Caricamento non riuscito/i);
    expect(alert).toHaveTextContent(/Boom/);
    expect(screen.queryByText(/Content/i)).toBeNull();
  });

  it("renders the retry button when onRetry is provided and fires it on click", () => {
    const onRetry = vi.fn();
    render(
      <DataLoader loading={false} error="Boom" onRetry={onRetry}>
        <p>Content</p>
      </DataLoader>
    );
    fireEvent.click(screen.getByRole("button", { name: /Riprova/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render the retry button when onRetry is not provided", () => {
    render(
      <DataLoader loading={false} error="Boom">
        <p>Content</p>
      </DataLoader>
    );
    expect(screen.queryByRole("button", { name: /Riprova/i })).toBeNull();
  });

  it("renders emptyState when empty is true (and not loading/error)", () => {
    render(
      <DataLoader
        loading={false}
        error={null}
        empty
        emptyState={<p>EMPTY</p>}
      >
        <p>Content</p>
      </DataLoader>
    );
    expect(screen.getByText(/EMPTY/i)).toBeInTheDocument();
    expect(screen.queryByText(/Content/i)).toBeNull();
  });

  it("renders children when not loading, no error, and not empty", () => {
    render(
      <DataLoader loading={false} error={null}>
        <p>Content</p>
      </DataLoader>
    );
    expect(screen.getByText(/Content/i)).toBeInTheDocument();
  });

  it("prioritizes loading over error and empty", () => {
    render(
      <DataLoader loading error="oops" empty emptyState={<p>EMPTY</p>}>
        <p>Content</p>
      </DataLoader>
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText(/EMPTY/i)).toBeNull();
  });
});
