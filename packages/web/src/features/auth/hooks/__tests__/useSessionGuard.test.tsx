import { StrictMode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InMemoryAuthService } from "@vet/shared/testing";
import { useSessionGuard } from "../useSessionGuard";

describe("useSessionGuard", () => {
  it("calls onRevoked when the auth service emits a revocation", async () => {
    const auth = new InMemoryAuthService();
    const onRevoked = vi.fn();
    renderHook(() => useSessionGuard({ auth, uid: "u1", onRevoked }));
    auth.simulateRevocation("u1", "disabled");
    await waitFor(() => expect(onRevoked).toHaveBeenCalledWith("disabled"));
  });

  it("does not call onRevoked when uid is null", async () => {
    const auth = new InMemoryAuthService();
    const onRevoked = vi.fn();
    renderHook(() => useSessionGuard({ auth, uid: null, onRevoked }));
    auth.simulateRevocation("u1", "disabled");
    expect(onRevoked).not.toHaveBeenCalled();
  });

  it("ignores revocations on other uids", async () => {
    const auth = new InMemoryAuthService();
    const onRevoked = vi.fn();
    renderHook(() => useSessionGuard({ auth, uid: "u1", onRevoked }));
    auth.simulateRevocation("other-uid", "disabled");
    expect(onRevoked).not.toHaveBeenCalled();
  });

  it("only fires once under StrictMode even if the subscription emits twice", async () => {
    const auth = new InMemoryAuthService();
    const onRevoked = vi.fn();
    renderHook(() => useSessionGuard({ auth, uid: "u1", onRevoked }), {
      wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
    });
    auth.simulateRevocation("u1", "disabled");
    auth.simulateRevocation("u1", "disabled");
    await waitFor(() => expect(onRevoked).toHaveBeenCalledTimes(1));
  });

  it("unsubscribes when uid changes", async () => {
    const auth = new InMemoryAuthService();
    const onRevoked = vi.fn();
    const { rerender } = renderHook(
      ({ uid }: { uid: string | null }) =>
        useSessionGuard({ auth, uid, onRevoked }),
      { initialProps: { uid: "u1" as string | null } }
    );
    rerender({ uid: null });
    auth.simulateRevocation("u1", "disabled");
    expect(onRevoked).not.toHaveBeenCalled();
  });
});
