import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  LoginPage,
  EmailLinkCompletePage,
  RequireAuth,
  useAuthState,
} from "./features/auth";
import { useRepositories } from "./infrastructure/RepositoriesContext";
import { Brand, Button, Card } from "./shared/ui";

function Home() {
  const { user } = useAuthState();
  const { auth } = useRepositories();
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-(--color-background)">
      <header className="border-b border-(--color-border) bg-(--color-surface)">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Brand size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-(--color-text-muted) hidden sm:inline">
              {user?.email}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => auth.signOut()}
            >
              Esci
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-medium tracking-tight text-(--color-text)">
            Ciao {firstName}
          </h1>
          <p className="text-(--color-text-muted) mt-3 text-base">
            La struttura è pronta. Le attività arrivano nel prossimo milestone.
          </p>

          <Card elevated className="mt-10">
            <p className="text-sm text-(--color-text-muted)">Stato sessione</p>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-(--color-text-subtle) text-xs uppercase tracking-wider mb-1">
                  Ruolo
                </dt>
                <dd className="font-medium text-(--color-text)">
                  {user?.roleId || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-(--color-text-subtle) text-xs uppercase tracking-wider mb-1">
                  Capabilities
                </dt>
                <dd className="font-medium text-(--color-text)">
                  {user?.caps.size ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-(--color-text-subtle) text-xs uppercase tracking-wider mb-1">
                  UID
                </dt>
                <dd className="font-mono text-xs text-(--color-text) truncate">
                  {user?.uid ?? "—"}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/complete" element={<EmailLinkCompletePage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
