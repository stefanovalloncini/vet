import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import type { Capability } from "@vet/shared";
import { useAuthState } from "../hooks/useAuthState";

interface RequireCapabilityProps {
  cap: Capability;
  children: ReactNode;
}

export function RequireCapability({ cap, children }: RequireCapabilityProps) {
  const { user } = useAuthState();
  if (!user?.caps.has(cap)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
