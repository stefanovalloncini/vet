import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuthState } from "../auth";
import { QuickEntryDialog } from "./ui/QuickEntryDialog";

export function QuickEntryFab() {
  const { user } = useAuthState();
  const [open, setOpen] = useState(false);

  if (!user?.caps.has("activities.create")) return null;

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
