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

const PrivacyPage = lazy(() =>
  import("./features/privacy").then((m) => ({ default: m.PrivacyPage }))
);

const NotFoundPage = lazy(() =>
  import("./features/not-found").then((m) => ({ default: m.NotFoundPage }))
);

const DevPrimitivesPage = import.meta.env.DEV
  ? lazy(() =>
      import("./features/dev-primitives").then((m) => ({ default: m.DevPrimitivesPage }))
    )
  : null;

const AdminPreviewPage = import.meta.env.DEV
  ? lazy(() =>
      import("./features/dev-primitives").then((m) => ({ default: m.AdminPreviewPage }))
    )
  : null;

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
        <Route
          path="/privacy"
          element={
            <RouteShell pathname={pathname}>
              <PrivacyPage />
            </RouteShell>
          }
        />
        {DevPrimitivesPage ? (
          <Route
            path="/dev/primitives"
            element={
              <RouteShell pathname={pathname}>
                <DevPrimitivesPage />
              </RouteShell>
            }
          />
        ) : null}
        {AdminPreviewPage ? (
          <Route
            path="/dev/admin"
            element={
              <RouteShell pathname={pathname}>
                <AdminPreviewPage />
              </RouteShell>
            }
          />
        ) : null}
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
        <Route
          path="*"
          element={
            <RouteShell pathname={pathname}>
              <NotFoundPage />
            </RouteShell>
          }
        />
      </Routes>
    </Suspense>
  );
}
