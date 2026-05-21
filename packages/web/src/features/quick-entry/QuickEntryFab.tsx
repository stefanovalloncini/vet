import { useState } from "react";
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
  /^\/strumenti/,
];

export function QuickEntryFab() {
  const { user } = useAuthState();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  if (!user?.caps.has("activities.create")) return null;
  if (HIDE_PATTERNS.some((rx) => rx.test(pathname))) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Voce rapida"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 sm:bottom-5 z-30 w-12 h-12 rounded-full bg-(--color-accent) text-white shadow-lg hover:bg-(--color-accent-hover) print:hidden flex items-center justify-center"
      >
        <Plus size={22} strokeWidth={2} aria-hidden="true" />
      </button>
      <QuickEntryDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
