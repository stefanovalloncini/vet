import type { ReactNode } from "react";
import type { Capability } from "@vet/shared";
import { useAuthState } from "../../features/auth";

type SingleProps = {
  cap: Capability;
  allOf?: never;
  anyOf?: never;
  fallback?: ReactNode;
  children: ReactNode;
};

type AllOfProps = {
  cap?: never;
  allOf: readonly Capability[];
  anyOf?: never;
  fallback?: ReactNode;
  children: ReactNode;
};

type AnyOfProps = {
  cap?: never;
  allOf?: never;
  anyOf: readonly Capability[];
  fallback?: ReactNode;
  children: ReactNode;
};

export type CapabilityGateProps = SingleProps | AllOfProps | AnyOfProps;

/** Renders children when the current user satisfies the capability check, else fallback. */
export function CapabilityGate(props: CapabilityGateProps): ReactNode {
  const { user } = useAuthState();
  const allowed = evaluate(user?.caps, props);
  return allowed ? props.children : (props.fallback ?? null);
}

function evaluate(
  caps: ReadonlySet<Capability> | undefined,
  props: CapabilityGateProps
): boolean {
  if (!caps) return false;
  if (props.cap !== undefined) return caps.has(props.cap);
  if (props.allOf !== undefined) return props.allOf.every((c) => caps.has(c));
  if (props.anyOf !== undefined) return props.anyOf.some((c) => caps.has(c));
  return false;
}
