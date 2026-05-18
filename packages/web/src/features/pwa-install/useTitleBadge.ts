import { useEffect } from "react";
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { useAuthState } from "../auth";

export function useTitleBadge() {
  const { user } = useAuthState();
  const { reminders } = useRepositories();

  useEffect(() => {
    if (!user?.caps.has("aziende.read")) return;
    let cancelled = false;
    const baseTitle = "Marinoni — Studio veterinario";
    void (async () => {
      try {
        const list = await reminders.list({ onlyOpen: true });
        if (cancelled) return;
        const now = Date.now();
        const overdue = list.filter((r) => r.dueAt.getTime() <= now).length;
        document.title = overdue > 0 ? `(${overdue}) ${baseTitle}` : baseTitle;
      } catch {
        document.title = baseTitle;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reminders]);
}
