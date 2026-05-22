import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Card,
  InlineError,
} from "../../../shared/ui";
import { RHFSelect, RHFTextField } from "../../../shared/ui/rhf";
import type { ActorContext } from "@vet/shared";
import { allowlistI18n as t } from "../i18n";
import { useAddAllowlistEntry } from "../hooks/useAllowlist";

const formSchema = z.object({
  email: z.string().trim().email(),
  defaultRoleId: z.string().min(1).max(60),
  notes: z.string().max(500),
});

type FormValues = z.infer<typeof formSchema>;

interface AddAllowlistEntryFormProps {
  roles: ReadonlyArray<{ id: string; name: string }>;
  user: ActorContext;
  onAdded: () => void;
  onCancel: () => void;
}

export function AddAllowlistEntryForm({
  roles,
  user,
  onAdded,
  onCancel,
}: AddAllowlistEntryFormProps) {
  const add = useAddAllowlistEntry();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", defaultRoleId: "vet", notes: "" },
    mode: "onSubmit",
  });

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));
  const busy = add.isPending || form.formState.isSubmitting;

  async function onSubmit(values: FormValues): Promise<void> {
    const notesTrim = values.notes.trim();
    try {
      await add.mutateAsync({
        input: {
          email: values.email,
          defaultRoleId: values.defaultRoleId,
          ...(notesTrim ? { notes: notesTrim } : {}),
        },
        actor: user.uid,
      });
      onAdded();
    } catch {
      form.setError("root", { message: t.saveError });
    }
  }

  return (
    <Card className="mb-6">
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {form.formState.errors.root?.message ? (
            <InlineError>{form.formState.errors.root.message}</InlineError>
          ) : null}
          <RHFTextField<FormValues>
            name="email"
            type="email"
            label={t.campoEmail}
            placeholder={t.campoEmailPlaceholder}
            required
            autoFocus
            disabled={busy}
          />
          <RHFSelect<FormValues>
            name="defaultRoleId"
            label={t.campoRuolo}
            options={roleOptions}
            disabled={busy}
          />
          <RHFTextField<FormValues>
            name="notes"
            label={t.campoNote}
            maxLength={500}
            disabled={busy}
          />
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={busy}
            >
              {t.annulla}
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {t.aggiungi}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}
