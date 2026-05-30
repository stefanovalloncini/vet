import { useMemo } from "react";
import type { Capability } from "@vet/shared";
import { useAuthState } from "../../features/auth";

/** Returns true when the current user has the given capability. */
export function useCapability(cap: Capability): boolean {
  const { user } = useAuthState();
  const caps = user?.caps;
  return useMemo(() => caps?.has(cap) ?? false, [caps, cap]);
}
