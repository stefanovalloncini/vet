import { BrowserRouter, Routes, Route } from "react-router-dom";
import styles from "./App.module.css";
import {
  LoginPage,
  EmailLinkCompletePage,
  RequireAuth,
  useAuthState,
} from "./features/auth";

function Home() {
  const { user } = useAuthState();
  return (
    <main className={styles.shell}>
      <h1>Vet</h1>
      <p>Benvenuto {user?.displayName ?? ""}</p>
    </main>
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
