import { SectionLabel, TextField } from "../../../shared/ui";

interface AttivitaReminderFieldProps {
  reminderTitle: string;
  reminderAt: string;
  busy: boolean;
  onUpdate: (key: "reminderTitle" | "reminderAt", value: string) => void;
}

export function AttivitaReminderField({
  reminderTitle,
  reminderAt,
  busy,
  onUpdate,
}: AttivitaReminderFieldProps) {
  return (
    <div className="pt-3 border-t border-(--color-border)">
      <SectionLabel className="mb-3">Prossimo richiamo (opzionale)</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          id="reminder-title"
          label="Titolo promemoria"
          value={reminderTitle}
          onChange={(e) => onUpdate("reminderTitle", e.target.value)}
          placeholder="Es. Richiamo vaccino"
          disabled={busy}
          maxLength={120}
        />
        <TextField
          id="reminder-at"
          type="date"
          label="Quando"
          value={reminderAt}
          onChange={(e) => onUpdate("reminderAt", e.target.value)}
          disabled={busy}
        />
      </div>
    </div>
  );
}
