import { useEffect, useState } from "react";
import { Button, Card, TextField } from "../../../shared/ui";

interface RetentionSettingsProps {
  value: number;
  onChange: (next: number) => void;
  busy?: boolean;
  min?: number;
  max?: number;
}

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 90;

export function RetentionSettings({
  value,
  onChange,
  busy = false,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
}: RetentionSettingsProps) {
  const [draft, setDraft] = useState<string>(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value]);
  const parsed = Number.parseInt(draft, 10);
  const valid = Number.isFinite(parsed) && parsed >= min && parsed <= max;
  const dirty = valid && parsed !== value;

  return (
    <Card>
      <h2 className="text-base font-medium text-(--color-text)">
        Permanenza nel cestino
      </h2>
      <p className="text-sm text-(--color-text-muted) mt-2 max-w-prose">
        Giorni in cui le attività eliminate restano recuperabili prima della
        cancellazione definitiva.
      </p>
      <div className="mt-5 flex items-end gap-3 flex-wrap">
        <div className="w-32">
          <TextField
            id="retention-days"
            label="Giorni"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
            error={!valid ? `Tra ${min} e ${max}` : undefined}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (dirty) onChange(parsed);
          }}
          disabled={busy || !dirty}
        >
          {busy ? "Salvataggio…" : "Salva"}
        </Button>
      </div>
    </Card>
  );
}
