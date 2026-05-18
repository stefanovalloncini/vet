import { useEffect, useState } from "react";
import type { ActorContext } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

export interface AuthState {
  loading: boolean;
  user: ActorContext | null;
}

export function useAuthState(): AuthState {
  const { auth } = useRepositories();
  const [state, setState] = useState<AuthState>({
    loading: true,
    user: auth.getCurrentUser(),
  });

  useEffect(() => {
    return auth.subscribe((user) => {
      setState({ loading: false, user });
    });
  }, [auth]);

  return state;
}
