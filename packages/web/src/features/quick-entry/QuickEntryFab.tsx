import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuthState } from "../auth";
import { QuickEntryDialog } from "./ui/QuickEntryDialog";

const HIDE_PATTERNS: ReadonlyArray<RegExp> = [
  /^\/attivita\/nuova$/,
  /^\/attivita\/[^/]+$/,
  /^\/aziende\/nuova$/,
  /^\/aziende\/[^/]+\/modifica$/,
  /^\/aziende\/[^/]+\/riepilogo$/,
  /^\/aziende\/importa$/,
  /^\/admin\//,
  /^\/impostazioni$/,
  /^\/promemoria$/,
  /^\/strumenti/,
];

export const QUICK_ENTRY_OPEN_EVENT = "vet:quick-entry:open";

export function openQuickEntry() {
  window.dispatchEvent(new CustomEvent(QUICK_ENTRY_OPEN_EVENT));
}

export function QuickEntryFab() {
  const { user } = useAuthState();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const enabled =
    !!user?.caps.has("activities.create") &&
    !HIDE_PATTERNS.some((rx) => rx.test(pathname));

  useEffect(() => {
    if (!enabled) return undefined;
    const handler = () => setOpen(true);
    window.addEventListener(QUICK_ENTRY_OPEN_EVENT, handler);
    return () => window.removeEventListener(QUICK_ENTRY_OPEN_EVENT, handler);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Voce rapida"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-[var(--fab-bottom)] sm:bottom-5 z-30 w-12 h-12 rounded-full bg-(--color-accent) text-white shadow-lg hover:bg-(--color-accent-hover) print:hidden flex items-center justify-center"
      >
        <Plus size={22} strokeWidth={2} aria-hidden="true" />
      </button>
      <QuickEntryDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
