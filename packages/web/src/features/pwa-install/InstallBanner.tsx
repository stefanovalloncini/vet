import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "vet.installPromptDismissedAt";

export function InstallBanner() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      const dismissed = window.localStorage.getItem(DISMISS_KEY);
      if (dismissed) {
        const ts = Number(dismissed);
        if (Date.now() - ts < 7 * 86_400_000) return;
      }
      setEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  useEffect(() => {
    function onInstalled() {
      setEvent(null);
    }
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (!event || hidden) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm z-30 print:hidden">
      <div className="bg-(--color-surface) border border-(--color-border) rounded-2xl p-4 shadow-lg flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-(--color-accent) text-white flex items-center justify-center flex-shrink-0">
          M
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-(--color-text)">
            Installa Marinoni sul telefono
          </p>
          <p className="text-xs text-(--color-text-muted) mt-1">
            Apri come app, anche offline.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={async () => {
                await event.prompt();
                const choice = await event.userChoice;
                if (choice.outcome === "dismissed") {
                  window.localStorage.setItem(
                    DISMISS_KEY,
                    String(Date.now())
                  );
                }
                setEvent(null);
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-(--color-accent) text-white"
            >
              Installa
            </button>
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
                setHidden(true);
              }}
              className="px-3 py-1.5 text-xs rounded-lg text-(--color-text-muted) hover:text-(--color-text)"
            >
              Non ora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
