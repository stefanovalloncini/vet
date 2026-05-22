import { ArrowLeft } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../shared/ui";
import { RHFTextField } from "../../../shared/ui/rhf";

const emailFormSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
});

export type EmailFormValues = z.infer<typeof emailFormSchema>;

interface EmailLinkFormProps {
  defaultEmail?: string;
  busy: boolean;
  onSubmit: (values: EmailFormValues) => Promise<void>;
  onBack: () => void;
}

export function EmailLinkForm({
  defaultEmail = "",
  busy,
  onSubmit,
  onBack,
}: EmailLinkFormProps) {
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: defaultEmail },
    mode: "onSubmit",
  });

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <RHFTextField<EmailFormValues>
          name="email"
          label="Email"
          type="email"
          autoFocus
          disabled={busy}
          placeholder="nome.cognome@studio.it"
          hint="Ti arriva un link a tempo. Apri dallo stesso dispositivo."
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={busy}
        >
          {busy ? "Invio in corso…" : "Inviami il link"}
        </Button>
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text) disabled:opacity-50 focus:outline-none focus-visible:underline underline-offset-4"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          Indietro
        </button>
      </form>
    </FormProvider>
  );
}
