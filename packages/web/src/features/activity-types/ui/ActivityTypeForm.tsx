import { useEffect, useRef } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../shared/ui";
import { RHFNumberField } from "../../../shared/ui/rhf";

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

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => onSubmit(values.tariffa))}
        className="mt-3 flex items-end gap-3"
      >
        <div className="w-44 max-w-full">
          <RHFNumberField<TariffaFormValues>
            name="tariffa"
            idPrefix={id}
            label="Tariffa standard (€)"
            step={10}
            min={0}
            max={100000}
            disabled={busy}
          />
        </div>
        <SubmitButton busy={busy} initialString={initialString} />
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
    <Button type="submit" variant="primary" size="sm" disabled={busy} className="mb-px h-11">
      Salva
    </Button>
  );
}
