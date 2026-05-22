import { useState, type ChangeEvent } from "react";
import { Button } from "../../../shared/ui";

interface Props {
  id: string;
  initial: number | undefined;
  busy: boolean;
  onSubmit: (value: string) => void;
}

export function ActivityTypeForm({ id, initial, busy, onSubmit }: Props) {
  const initialString = initial !== undefined ? String(initial) : "";
  const [value, setValue] = useState(initialString);
  const dirty = value !== initialString;

  return (
    <div className="mt-3 flex items-center gap-2">
      <label
        htmlFor={`tariffa-${id}`}
        className="text-xs uppercase tracking-wider text-(--color-text-muted) w-32 shrink-0"
      >
        Tariffa standard
      </label>
      <input
        id={`tariffa-${id}`}
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        placeholder="—"
        disabled={busy}
        className="w-28 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/20 focus:border-(--color-accent)"
      />
      <span className="text-xs text-(--color-text-muted)">€</span>
      {dirty ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => onSubmit(value)}
          disabled={busy}
        >
          Salva
        </Button>
      ) : null}
    </div>
  );
}
