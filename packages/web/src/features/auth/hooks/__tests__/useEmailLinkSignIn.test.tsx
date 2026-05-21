import { StrictMode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { AuthService } from "@vet/shared";
import { useEmailLinkSignIn } from "../useEmailLinkSignIn";

function makeAuth(overrides: Partial<AuthService> = {}): AuthService {
  return {
    getCurrentUser: vi.fn().mockReturnValue(null),
    subscribe: vi.fn().mockReturnValue(() => {}),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    sendEmailSignInLink: vi.fn().mockResolvedValue(undefined),
    completeEmailSignIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as AuthService;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEmailLinkSignIn", () => {
  it("calls completeEmailSignIn exactly once even under StrictMode", async () => {
    const completeEmailSignIn = vi.fn().mockResolvedValue(undefined);
    const auth = makeAuth({ completeEmailSignIn });
    renderHook(() => useEmailLinkSignIn(auth, "https://example.com/signin?oob=abc"), {
      wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
    });
    await waitFor(() => {
      expect(completeEmailSignIn).toHaveBeenCalledTimes(1);
    });
    expect(completeEmailSignIn).toHaveBeenCalledWith("https://example.com/signin?oob=abc");
  });

  it("propagates errors to state even under StrictMode", async () => {
    const auth = makeAuth({
      completeEmailSignIn: vi
        .fn()
        .mockRejectedValue({ code: "auth/invalid-action-code" }),
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(
      () => useEmailLinkSignIn(auth, "https://example.com/signin"),
      { wrapper: ({ children }) => <StrictMode>{children}</StrictMode> }
    );
    await waitFor(() => {
      expect(result.current.state.kind).toBe("error");
    });
    errSpy.mockRestore();
  });

  it("starts in 'running' state", () => {
    const auth = makeAuth();
    const { result } = renderHook(() =>
      useEmailLinkSignIn(auth, "https://example.com/signin")
    );
    expect(result.current.state.kind).toBe("running");
  });

  it("transitions to 'needsEmail' when SDK throws 'email not remembered'", async () => {
    const auth = makeAuth({
      completeEmailSignIn: vi
        .fn()
        .mockRejectedValue(new Error("email not remembered for sign-in")),
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() =>
      useEmailLinkSignIn(auth, "https://example.com/signin")
    );
    await waitFor(() => {
      expect(result.current.state.kind).toBe("needsEmail");
    });
    errSpy.mockRestore();
  });

  it("transitions to 'error' on other failures", async () => {
    const auth = makeAuth({
      completeEmailSignIn: vi.fn().mockRejectedValue({
        code: "auth/invalid-action-code",
      }),
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() =>
      useEmailLinkSignIn(auth, "https://example.com/signin")
    );
    await waitFor(() => {
      expect(result.current.state.kind).toBe("error");
    });
    if (result.current.state.kind === "error") {
      expect(result.current.state.message.length).toBeGreaterThan(0);
    }
    errSpy.mockRestore();
  });

  it("submitWithEmail calls completeEmailSignIn with the provided email", async () => {
    const completeEmailSignIn = vi.fn().mockResolvedValue(undefined);
    const auth = makeAuth({ completeEmailSignIn });
    const { result } = renderHook(() =>
      useEmailLinkSignIn(auth, "https://example.com/signin")
    );
    await waitFor(() => {
      expect(completeEmailSignIn).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      await result.current.submitWithEmail("user@example.com");
    });
    expect(completeEmailSignIn).toHaveBeenCalledTimes(2);
    expect(completeEmailSignIn).toHaveBeenLastCalledWith(
      "https://example.com/signin",
      "user@example.com"
    );
  });
});
