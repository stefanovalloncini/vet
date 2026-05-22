import { type ReactElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../infrastructure/RepositoriesContext";
import { ToastProvider } from "../shared/ui/Toast";

interface ProviderOptions {
  repos: Partial<Repositories>;
  withToast?: boolean;
  withRouter?: boolean;
  initialEntries?: string[];
  queryClient?: QueryClient;
}

function makeDefaultClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function buildProvidersWrapper(
  options: ProviderOptions
): (props: { children: ReactNode }) => ReactElement {
  const {
    repos,
    withToast = false,
    withRouter = false,
    initialEntries,
    queryClient,
  } = options;
  const client = queryClient ?? makeDefaultClient();
  return function Wrapper({ children }) {
    let tree: ReactNode = children;
    if (withRouter) {
      tree = (
        <MemoryRouter initialEntries={initialEntries ?? ["/"]}>{tree}</MemoryRouter>
      );
    }
    if (withToast) {
      tree = <ToastProvider>{tree}</ToastProvider>;
    }
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos as Repositories}>
          {tree}
        </RepositoriesProvider>
      </QueryClientProvider>
    );
  };
}
