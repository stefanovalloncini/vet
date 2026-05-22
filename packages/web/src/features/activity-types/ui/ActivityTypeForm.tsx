import { useEffect, useRef } from "react";
import { FormProvider, useController, useForm, useFormContext } from "react-hook-form";
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

  const current = form.watch("tariffa");
  const error = form.formState.errors.tariffa?.message;
  const dirty = current !== initialString;
  const inputId = `tariffa-${id}`;

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => onSubmit(values.tariffa))}
        className="mt-3"
      >
        <div className="flex items-center gap-2">
          <label
            htmlFor={inputId}
            className="text-xs uppercase tracking-wider text-(--color-text-muted) w-32 shrink-0"
          >
            Tariffa standard
          </label>
          <TariffaInput inputId={inputId} disabled={busy} hasError={!!error} />
          <span className="text-xs text-(--color-text-muted)">€</span>
          {dirty ? (
            <Button type="submit" variant="primary" size="sm" disabled={busy}>
              Salva
            </Button>
          ) : null}
        </div>
        {error ? (
          <p className="mt-2 text-xs text-(--color-danger)" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </FormProvider>
  );
}

interface TariffaInputProps {
  inputId: string;
  disabled: boolean;
  hasError: boolean;
}

function TariffaInput({ inputId, disabled, hasError }: TariffaInputProps) {
  const { control } = useFormContext<TariffaFormValues>();
  const { field } = useController({ name: "tariffa", control });
  const tone = hasError
    ? "border-(--color-danger) focus:border-(--color-danger)"
    : "border-(--color-border) focus:border-(--color-accent)";
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
      className={`w-28 rounded-lg border bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/20 ${tone}`}
    />
  );
}
