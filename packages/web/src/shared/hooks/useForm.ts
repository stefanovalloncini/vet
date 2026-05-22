import { useCallback, useMemo, useRef, useState } from "react";

/**
 * @deprecated Unused. The forms migration will replace this with `react-hook-form`
 * wrappers under `shared/ui/rhf/`. Delete this file at the end of the RHF
 * migration (see `~/.claude/plans/Vet/2026-05-22-data-and-forms-migration.md`).
 */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

interface ParseIssue {
  path: ReadonlyArray<string | number>;
  message: string;
}

interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: { issues: ReadonlyArray<ParseIssue> };
}

interface ParsableSchema<TInput, TParsed> {
  safeParse(input: TInput): ParseResult<TParsed>;
}

interface UseFormConfig<TInput, TParsed> {
  initial: TInput;
  schema: ParsableSchema<TInput, TParsed>;
  onSubmit: (parsed: TParsed) => Promise<void> | void;
}

export interface UseFormResult<TInput> {
  values: TInput;
  errors: FieldErrors<TInput>;
  globalError: string | null;
  setField: <K extends keyof TInput>(key: K, value: TInput[K]) => void;
  setValues: (values: TInput) => void;
  reset: (values?: TInput) => void;
  submit: () => Promise<void>;
  busy: boolean;
  isDirty: boolean;
}

function issuesToFieldErrors<T>(issues: ReadonlyArray<ParseIssue>): FieldErrors<T> {
  const out: FieldErrors<T> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) {
      (out as Record<string, string>)[key] = issue.message;
    }
  }
  return out;
}

/**
 * @deprecated Unused. The forms migration will replace this with `react-hook-form`
 * wrappers under `shared/ui/rhf/`. Delete this file at the end of the RHF
 * migration (see `~/.claude/plans/Vet/2026-05-22-data-and-forms-migration.md`).
 */
export function useForm<TInput extends object, TParsed>(
  config: UseFormConfig<TInput, TParsed>
): UseFormResult<TInput> {
  const initialRef = useRef(config.initial);
  const [values, setValuesState] = useState<TInput>(config.initial);
  const [errors, setErrors] = useState<FieldErrors<TInput>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setField = useCallback<UseFormResult<TInput>["setField"]>((key, value) => {
    setValuesState((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }, []);

  const setValues = useCallback<UseFormResult<TInput>["setValues"]>((next) => {
    setValuesState(next);
    setErrors({});
  }, []);

  const reset = useCallback<UseFormResult<TInput>["reset"]>((next) => {
    const target = next ?? initialRef.current;
    setValuesState(target);
    setErrors({});
    setGlobalError(null);
    setBusy(false);
  }, []);

  const submit = useCallback<UseFormResult<TInput>["submit"]>(async () => {
    setGlobalError(null);
    const parsed = config.schema.safeParse(values);
    if (!parsed.success || parsed.data === undefined) {
      const issues = parsed.error?.issues ?? [];
      setErrors(issuesToFieldErrors<TInput>(issues));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await config.onSubmit(parsed.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setGlobalError(msg);
      console.error("form submit failed", err);
    } finally {
      setBusy(false);
    }
  }, [config, values]);

  const isDirty = useMemo(() => {
    const init = initialRef.current as Record<string, unknown>;
    const cur = values as Record<string, unknown>;
    for (const k of Object.keys(init)) {
      if (init[k] !== cur[k]) return true;
    }
    for (const k of Object.keys(cur)) {
      if (!(k in init)) return true;
    }
    return false;
  }, [values]);

  return {
    values,
    errors,
    globalError,
    setField,
    setValues,
    reset,
    submit,
    busy,
    isDirty,
  };
}
