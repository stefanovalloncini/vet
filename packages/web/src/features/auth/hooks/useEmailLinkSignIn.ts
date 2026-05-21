import { useEffect, useRef, useState, useCallback } from "react";
import type { AuthService } from "@vet/shared";
import { getAuthErrorMessage } from "../lib/authErrors";

export type EmailLinkSignInState =
  | { kind: "running" }
  | { kind: "needsEmail" }
  | { kind: "submittingWithEmail" }
  | { kind: "error"; message: string };

export interface EmailLinkSignInResult {
  state: EmailLinkSignInState;
  submitWithEmail: (email: string) => Promise<void>;
}

function classifyError(err: unknown): EmailLinkSignInState {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("email not remembered")) {
    return { kind: "needsEmail" };
  }
  return { kind: "error", message: getAuthErrorMessage(err) };
}

export function useEmailLinkSignIn(
  auth: AuthService,
  url: string
): EmailLinkSignInResult {
  const [state, setState] = useState<EmailLinkSignInState>({ kind: "running" });
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    auth.completeEmailSignIn(url).catch((err) => {
      console.error("email link sign-in failed", err);
      setState(classifyError(err));
    });
  }, [auth, url]);

  const submitWithEmail = useCallback(
    async (email: string) => {
      setState({ kind: "submittingWithEmail" });
      try {
        await auth.completeEmailSignIn(url, email);
      } catch (err) {
        console.error("email link sign-in failed", err);
        setState(classifyError(err));
      }
    },
    [auth, url]
  );

  return { state, submitWithEmail };
}
