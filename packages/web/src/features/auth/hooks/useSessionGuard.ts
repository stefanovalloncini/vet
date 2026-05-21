import { useEffect, useRef } from "react";
import type {
  AuthService,
  SessionRevokedReason,
} from "@vet/shared";

interface UseSessionGuardArgs {
  auth: AuthService;
  uid: string | null | undefined;
  onRevoked: (reason: SessionRevokedReason) => void;
}

export function useSessionGuard({
  auth,
  uid,
  onRevoked,
}: UseSessionGuardArgs): void {
  const tripped = useRef(false);

  useEffect(() => {
    if (!uid) {
      tripped.current = false;
      return;
    }
    const unsubscribe = auth.subscribeRevocation(uid, (reason) => {
      if (tripped.current) return;
      tripped.current = true;
      onRevoked(reason);
    });
    return () => {
      unsubscribe();
    };
  }, [auth, uid, onRevoked]);
}
