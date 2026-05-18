import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { RepositoriesProvider } from "./infrastructure/RepositoriesContext";
import { createFirestoreRepositories } from "./infrastructure/composition/firestore";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("root element not found");

const repositories = createFirestoreRepositories();

createRoot(rootEl).render(
  <StrictMode>
    <RepositoriesProvider value={repositories}>
      <App />
    </RepositoriesProvider>
  </StrictMode>
);
