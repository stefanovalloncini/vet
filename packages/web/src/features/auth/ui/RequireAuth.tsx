import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthState } from "../hooks/useAuthState";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, user } = useAuthState();
  if (loading) return <p>Caricamento...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
