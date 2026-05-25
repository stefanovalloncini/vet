import { ArrowLeft } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../shared/ui";
import { RHFTextArea, RHFTextField } from "../../../shared/ui/rhf";

const accessRequestSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
  name: z.string().trim().min(2, "Inserisci nome e cognome").max(120),
  reason: z.string().trim().max(500).optional(),
});

export type AccessRequestFormValues = z.infer<typeof accessRequestSchema>;

interface AccessRequestFormProps {
  busy: boolean;
  onSubmit: (values: AccessRequestFormValues) => Promise<void>;
  onBack: () => void;
}

export function AccessRequestForm({
  busy,
  onSubmit,
  onBack,
}: AccessRequestFormProps) {
  const form = useForm<AccessRequestFormValues>({
    resolver: zodResolver(accessRequestSchema),
    defaultValues: { email: "", name: "", reason: "" },
    mode: "onSubmit",
  });

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <RHFTextField<AccessRequestFormValues>
          name="email"
          label="Email"
          type="email"
          autoFocus
          disabled={busy}
          placeholder="nome.cognome@studio.it"
        />
        <RHFTextField<AccessRequestFormValues>
          name="name"
          label="Nome e cognome"
          disabled={busy}
          placeholder="Mario Rossi"
          maxLength={120}
        />
        <RHFTextArea<AccessRequestFormValues>
          name="reason"
          label="Motivazione"
          disabled={busy}
          placeholder="Sono un veterinario dello studio Marinoni"
          rows={3}
          maxLength={500}
          hint="Facoltativa. Aiuta l'amministratore a riconoscerti."
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={busy}
        >
          {busy ? "Invio in corso…" : "Invia richiesta"}
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
