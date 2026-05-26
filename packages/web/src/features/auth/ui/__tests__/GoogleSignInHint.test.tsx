import { render, screen, act, fireEvent } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { GoogleSignInHint } from "../GoogleSignInHint";

describe("GoogleSignInHint", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing while idle (busy=false)", () => {
    const { container } = render(
      <GoogleSignInHint busy={false} onRetry={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing in the first 2 seconds of busy", () => {
    const { container } = render(
      <GoogleSignInHint busy={true} onRetry={() => {}} />
    );
    expect(container.firstChild).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(container.firstChild).toBeNull();
  });

  it("shows the open-Google hint after 2 seconds of busy", () => {
    render(<GoogleSignInHint busy={true} onRetry={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByText(/Apri la finestra di Google per continuare/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Non si è aperta/i })
    ).not.toBeInTheDocument();
  });

  it("shows the retry button after 5 seconds of busy", () => {
    render(<GoogleSignInHint busy={true} onRetry={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(
      screen.getByRole("button", { name: /Non si è aperta/i })
    ).toBeInTheDocument();
  });

  it("invokes onRetry when the retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<GoogleSignInHint busy={true} onRetry={onRetry} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    fireEvent.click(screen.getByRole("button", { name: /Non si è aperta/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("resets when busy returns to false", () => {
    const { rerender, container } = render(
      <GoogleSignInHint busy={true} onRetry={() => {}} />
    );
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(
      screen.getByRole("button", { name: /Non si è aperta/i })
    ).toBeInTheDocument();
    rerender(<GoogleSignInHint busy={false} onRetry={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
