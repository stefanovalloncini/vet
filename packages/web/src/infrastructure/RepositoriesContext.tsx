import { createContext, useContext, type ReactNode } from "react";
import type { Repositories } from "@vet/shared";

const RepositoriesContext = createContext<Repositories | null>(null);

export function RepositoriesProvider({
  value,
  children,
}: {
  value: Repositories;
  children: ReactNode;
}) {
  return (
    <RepositoriesContext.Provider value={value}>
      {children}
    </RepositoriesContext.Provider>
  );
}

export function useRepositories(): Repositories {
  const ctx = useContext(RepositoriesContext);
  if (!ctx) {
    throw new Error("useRepositories must be used inside <RepositoriesProvider>");
  }
  return ctx;
}
