import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "../../../shared/ui";

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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(value));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const parsed = Number.parseInt(draft, 10);
  const valid = Number.isFinite(parsed) && parsed >= min && parsed <= max;
  const dirty = valid && parsed !== value;

  function commit() {
    if (!valid || !dirty) return;
    onChange(parsed);
    setEditing(false);
  }

  function cancel() {
    setDraft(String(value));
    setEditing(false);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  if (!editing) {
    return (
      <div className="inline-flex items-center gap-3">
        <span className="tabular-nums text-(--color-text)">
          {value} {value === 1 ? "giorno" : "giorni"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          disabled={busy}
        >
          Modifica
        </Button>
      </div>
    );
  }

  const fieldId = "retention-days-input";
  const errorId = "retention-days-error";

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className="inline-flex items-center gap-2">
        <input
          ref={inputRef}
          id={fieldId}
          aria-label="Giorni"
          aria-invalid={!valid}
          aria-describedby={!valid ? errorId : undefined}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          disabled={busy}
          className={[
            "w-16 px-2 py-1.5 text-sm rounded-md bg-(--color-surface) border tabular-nums text-right",
            "text-(--color-text) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)",
            valid ? "border-(--color-border)" : "border-(--color-danger)",
            busy ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
        />
        <span className="text-xs text-(--color-text-muted)">giorni</span>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={commit}
          disabled={busy || !valid || !dirty}
        >
          {busy ? "Salvataggio…" : "Salva"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancel}
          disabled={busy}
        >
          Annulla
        </Button>
      </div>
      {!valid ? (
        <p id={errorId} role="alert" className="text-xs text-(--color-danger)">
          Tra {min} e {max}
        </p>
      ) : null}
    </div>
  );
}
