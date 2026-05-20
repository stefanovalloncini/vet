import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Spinner } from "../../../shared/ui";
import { useAuthState } from "../hooks/useAuthState";
import { PendingApproval } from "./PendingApproval";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, user } = useAuthState();
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--color-background)">
        <Spinner size={22} label="Caricamento…" />
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!user.approved) return <PendingApproval />;
  return <>{children}</>;
}
