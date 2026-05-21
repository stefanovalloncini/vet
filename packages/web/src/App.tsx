import { Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import {
  LoginPage,
  EmailLinkCompletePage,
  RequireAuth,
} from "./features/auth";
import { Brand, RouteBoundary, Spinner } from "./shared/ui";
import { PROTECTED_ROUTES } from "./routes";

function RouteFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-(--color-background)">
      <div className="flex flex-col items-center gap-5">
        <Brand size="md" />
        <Spinner size={22} label="Caricamento…" />
      </div>
    </main>
  );
}

export function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <RouteBoundary key={location.pathname}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/complete" element={<EmailLinkCompletePage />} />
          {PROTECTED_ROUTES.map(({ path, Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <RequireAuth>
                  <Component />
                </RequireAuth>
              }
            />
          ))}
        </Routes>
      </Suspense>
    </RouteBoundary>
  );
}
