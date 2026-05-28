import { useEffect, useRef } from "react";
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../shared/ui";

const tariffaFormSchema = z.object({
  tariffa: z.string().superRefine((value, ctx) => {
    const trimmed = value.trim();
    if (trimmed === "") return;
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 0 || num > 100000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tariffa non valida",
      });
    }
  }),
});

type TariffaFormValues = z.infer<typeof tariffaFormSchema>;

interface Props {
  id: string;
  initial: number | undefined;
  busy: boolean;
  onSubmit: (value: string) => void;
}

export function ActivityTypeForm({ id, initial, busy, onSubmit }: Props) {
  const initialString = initial !== undefined ? String(initial) : "";
  const form = useForm<TariffaFormValues>({
    resolver: zodResolver(tariffaFormSchema),
    defaultValues: { tariffa: initialString },
    mode: "onSubmit",
  });

  const lastInitialRef = useRef(initialString);
  useEffect(() => {
    if (lastInitialRef.current !== initialString) {
      lastInitialRef.current = initialString;
      form.reset({ tariffa: initialString });
    }
  }, [initialString, form]);

  const error = form.formState.errors.tariffa?.message;
  const inputId = `tariffa-${id}`;
  const errorId = `tariffa-${id}-error`;

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => onSubmit(values.tariffa))}
        className="mt-3"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <label
            htmlFor={inputId}
            className="text-xs uppercase tracking-wider text-(--color-text-muted) w-32 shrink-0"
          >
            Tariffa standard
          </label>
          <TariffaInput
            inputId={inputId}
            disabled={busy}
            hasError={!!error}
            describedBy={error ? errorId : undefined}
          />
          <span className="text-xs text-(--color-text-muted)" aria-hidden="true">
            €
          </span>
          <SubmitButton busy={busy} initialString={initialString} />
        </div>
        {error ? (
          <p id={errorId} className="mt-2 text-xs text-(--color-danger)" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </FormProvider>
  );
}

function SubmitButton({
  busy,
  initialString,
}: {
  busy: boolean;
  initialString: string;
}) {
  const current = useWatch<TariffaFormValues>({ name: "tariffa" }) ?? "";
  if (current === initialString) return null;
  return (
    <Button type="submit" variant="primary" size="sm" disabled={busy}>
      Salva
    </Button>
  );
}

interface TariffaInputProps {
  inputId: string;
  disabled: boolean;
  hasError: boolean;
  describedBy?: string | undefined;
}

function TariffaInput({ inputId, disabled, hasError, describedBy }: TariffaInputProps) {
  const { control } = useFormContext<TariffaFormValues>();
  const { field } = useController({ name: "tariffa", control });
  const tone = hasError
    ? "border-(--color-danger) focus:border-(--color-danger)"
    : "border-(--color-border) hover:border-(--color-border-strong) focus:border-(--color-accent)";
  return (
    <input
      id={inputId}
      name={field.name}
      type="number"
      inputMode="decimal"
      step="0.01"
      min="0"
      placeholder="—"
      disabled={disabled}
      value={field.value ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
      aria-invalid={hasError ? true : undefined}
      aria-describedby={describedBy}
      className={`w-28 h-11 rounded-lg border bg-(--color-surface) px-3 text-sm text-(--color-text) tabular-nums transition-[border-color] duration-(--motion-fast) ease-(--ease-out-quart) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1 disabled:opacity-50 ${tone}`}
    />
  );
}
