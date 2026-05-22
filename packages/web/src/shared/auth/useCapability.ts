import { useMemo } from "react";
import type { Capability } from "@vet/shared";
import { useAuthState } from "../../features/auth/hooks/useAuthState";

/** Returns true when the current user has the given capability. */
export function useCapability(cap: Capability): boolean {
  const { user } = useAuthState();
  const caps = user?.caps;
  return useMemo(() => caps?.has(cap) ?? false, [caps, cap]);
}

/** Returns a `{[cap]: boolean}` map for a batch of capability checks. */
export function useCapabilities<C extends Capability>(
  ...caps: readonly C[]
): Record<C, boolean> {
  const { user } = useAuthState();
  const userCaps = user?.caps;
  const requested = caps.join("|");
  const present = userCaps
    ? caps
        .filter((c) => userCaps.has(c))
        .join("|")
    : "";
  return useMemo(() => {
    const out = {} as Record<C, boolean>;
    for (const cap of caps) out[cap] = userCaps?.has(cap) ?? false;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested, present]);
}
