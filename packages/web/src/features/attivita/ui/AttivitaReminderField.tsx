import { RHFTextField } from "../../../shared/ui/rhf";
import type { AttivitaFormValues } from "../lib/formSchema";

interface AttivitaReminderFieldProps {
  busy: boolean;
}

export function AttivitaReminderField({ busy }: AttivitaReminderFieldProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <RHFTextField<AttivitaFormValues>
        name="reminderTitle"
        label="Titolo promemoria"
        placeholder="Es. Richiamo vaccino"
        disabled={busy}
        maxLength={120}
      />
      <RHFTextField<AttivitaFormValues>
        name="reminderAt"
        type="date"
        label="Quando"
        disabled={busy}
      />
    </div>
  );
}
