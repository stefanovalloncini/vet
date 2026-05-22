import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import {
  LoginPage,
  EmailLinkCompletePage,
  RequireAuth,
} from "./features/auth";
import {
  PROTECTED_ROUTES,
  RouteFallback,
  RouteShell,
} from "./routes";

const SicurezzaPage = lazy(() =>
  import("./features/diagnostics").then((m) => ({ default: m.SicurezzaPage }))
);

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
  const { pathname } = useLocation();
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/login"
          element={
            <RouteShell pathname={pathname}>
              <LoginPage />
            </RouteShell>
          }
        />
        <Route
          path="/login/complete"
          element={
            <RouteShell pathname={pathname}>
              <EmailLinkCompletePage />
            </RouteShell>
          }
        />
        <Route
          path="/sicurezza"
          element={
            <RouteShell pathname={pathname}>
              <SicurezzaPage />
            </RouteShell>
          }
        />
        {PROTECTED_ROUTES.map(({ path, Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <RouteShell pathname={pathname}>
                <RequireAuth>
                  <Component />
                </RequireAuth>
              </RouteShell>
            }
          />
        ))}
      </Routes>
    </Suspense>
  );
}
