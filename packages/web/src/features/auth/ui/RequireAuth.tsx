import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Spinner } from "../../../shared/ui";
import { useAuthState } from "../hooks/useAuthState";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, user } = useAuthState();
  if (user) return <>{children}</>;
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--color-background)">
        <Spinner size={22} label="Caricamento…" />
      </main>
    );
  }
  return <Navigate to="/login" replace />;
}
