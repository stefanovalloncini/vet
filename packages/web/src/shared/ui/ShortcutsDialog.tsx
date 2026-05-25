import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: ReadonlyArray<Shortcut> = [
  { keys: ["⌘", "K"], description: "Apri la ricerca rapida" },
  { keys: ["N"], description: "Aggiungi una nuova attività" },
  { keys: ["?"], description: "Mostra questa lista di scorciatoie" },
  { keys: ["Esc"], description: "Chiudi dialoghi e popup" },
];

export const SHORTCUTS_OPEN_EVENT = "vet:shortcuts:open";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "?" || isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      setOpen((o) => !o);
    }
    function onOpenRequested() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(SHORTCUTS_OPEN_EVENT, onOpenRequested);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SHORTCUTS_OPEN_EVENT, onOpenRequested);
    };
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      labelledBy="shortcuts-dialog-title"
      size="sm"
    >
      <div className="p-5 sm:p-6">
        <h2
          id="shortcuts-dialog-title"
          className="text-base font-medium text-(--color-text)"
        >
          Scorciatoie da tastiera
        </h2>
        <ul className="mt-4 space-y-2.5">
          {SHORTCUTS.map((s) => (
            <li
              key={s.description}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-(--color-text-muted)">{s.description}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <kbd
                    key={`${s.description}-${i}`}
                    className="px-2 py-0.5 rounded border border-(--color-border) bg-(--color-surface-muted) text-xs font-mono text-(--color-text)"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
