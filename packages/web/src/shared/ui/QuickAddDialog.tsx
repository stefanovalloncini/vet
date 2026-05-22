import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

export type QuickAddErrors<V> = Partial<Record<keyof V, string>>;

interface ParseIssue {
  path: ReadonlyArray<string | number>;
  message: string;
}

export interface QuickAddSchema<V> {
  safeParse(input: unknown): {
    success: boolean;
    data?: V;
    error?: { issues: ReadonlyArray<ParseIssue> };
  };
}

export interface QuickAddFormState<V> {
  values: V;
  setField: <K extends keyof V>(key: K, value: V[K]) => void;
  errors: QuickAddErrors<V>;
  busy: boolean;
}

interface QuickAddDialogProps<T, V extends object> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  schema: QuickAddSchema<V>;
  initialValues: V;
  submit: (values: V) => Promise<T>;
  onCreated?: (entity: T) => void;
  children: (form: QuickAddFormState<V>) => ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  canSubmit?: (values: V) => boolean;
  labelledBy?: string;
}

function issuesToErrors<V>(issues: ReadonlyArray<ParseIssue>): QuickAddErrors<V> {
  const out: QuickAddErrors<V> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) {
      (out as Record<string, string>)[key] = issue.message;
    }
  }
  return out;
}

export function QuickAddDialog<T, V extends object>({
  open,
  onClose,
  title,
  description,
  schema,
  initialValues,
  submit,
  onCreated,
  children,
  submitLabel = "Crea",
  cancelLabel = "Annulla",
  canSubmit,
  labelledBy = "quick-add-dialog-title",
}: QuickAddDialogProps<T, V>) {
  const [values, setValues] = useState<V>(initialValues);
  const [errors, setErrors] = useState<QuickAddErrors<V>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(initialValues);
    setErrors({});
    setGlobalError(null);
    setBusy(false);
  }, [open, initialValues]);

  function setField<K extends keyof V>(key: K, value: V[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleClose() {
    if (!busy) onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success || parsed.data === undefined) {
      const issues = parsed.error?.issues ?? [];
      setErrors(issuesToErrors<V>(issues));
      setGlobalError(issues[0]?.message ?? "Dati non validi");
      return;
    }
    setErrors({});
    setGlobalError(null);
    setBusy(true);
    try {
      const created = await submit(parsed.data);
      onCreated?.(created);
      onClose();
    } catch (err) {
      console.error("quick add failed", err);
      setGlobalError(err instanceof Error ? err.message : "Salvataggio non riuscito");
    } finally {
      setBusy(false);
    }
  }

  const submitDisabled = busy || (canSubmit ? !canSubmit(values) : false);

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={labelledBy} size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <h2 id={labelledBy} className="text-base font-medium text-(--color-text)">
            {title}
          </h2>
          {description ? (
            <p className="text-xs text-(--color-text-muted) mt-1">{description}</p>
          ) : null}
        </div>
        {children({ values, setField, errors, busy })}
        {globalError ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {globalError}
          </p>
        ) : null}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant="primary" disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
