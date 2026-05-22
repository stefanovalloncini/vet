import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { RepositoriesProvider } from "./infrastructure/RepositoriesContext";
import { createFirestoreRepositories } from "./infrastructure/composition/firestore";
import { QueryProvider } from "./shared/data";
import { ToastProvider } from "./shared/ui/Toast";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("root element not found");

const repositories = createFirestoreRepositories();

registerSW({ immediate: true });

const CHUNK_RELOAD_KEY = "vet.chunk-reloaded";
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
});

createRoot(rootEl).render(
  <StrictMode>
    <QueryProvider>
      <RepositoriesProvider value={repositories}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </RepositoriesProvider>
    </QueryProvider>
  </StrictMode>
);
