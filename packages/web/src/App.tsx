import { useEffect, useState } from "react";
import styles from "./App.module.css";
import { useRepositories } from "./infrastructure/RepositoriesContext";

export function App() {
  const { clock } = useRepositories();
  const [now, setNow] = useState<string>(() => clock.now().toISOString());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(clock.now().toISOString());
    }, 1000);
    return () => window.clearInterval(id);
  }, [clock]);

  return (
    <main className={styles.shell}>
      <h1>Vet</h1>
      <p>Foundation skeleton.</p>
      <p className={styles.tick}>
        Clock tick: <time dateTime={now}>{now}</time>
      </p>
    </main>
  );
}
