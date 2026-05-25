import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
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
  onEmailChange?: (email: string) => void;
}

export function EmailLinkForm({
  defaultEmail = "",
  busy,
  onSubmit,
  onEmailChange,
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
        className="space-y-4"
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
        {onEmailChange ? <EmailDraftSync onChange={onEmailChange} /> : null}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={busy}
        >
          {busy ? "Invio in corso…" : "Invia magic link"}
        </Button>
      </form>
    </FormProvider>
  );
}

function EmailDraftSync({ onChange }: { onChange: (email: string) => void }) {
  const email = useWatch<EmailFormValues, "email">({ name: "email" });
  useEffect(() => {
    onChange(email ?? "");
  }, [email, onChange]);
  return null;
}
