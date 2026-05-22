import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Dialog,
  InlineError,
} from "../../../shared/ui";
import { RHFSelect } from "../../../shared/ui/rhf";
import type { AccessRequest } from "@vet/shared";
import { allowlistI18n as t } from "../i18n";
import { useAcceptAccessRequest } from "../hooks/useAccessRequests";

const formSchema = z.object({
  roleId: z.string().min(1).max(60),
});

type FormValues = z.infer<typeof formSchema>;

interface AcceptAccessRequestDialogProps {
  open: boolean;
  request: AccessRequest | null;
  roles: ReadonlyArray<{ id: string; name: string }>;
  onClose: () => void;
  onAccepted: () => void;
}

const defaultValues: FormValues = { roleId: "vet" };

export function AcceptAccessRequestDialog({
  open,
  request,
  roles,
  onClose,
  onAccepted,
}: AcceptAccessRequestDialogProps) {
  const accept = useAcceptAccessRequest();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, form]);

  const busy = accept.isPending || form.formState.isSubmitting;

  async function onSubmit(values: FormValues): Promise<void> {
    if (!request) return;
    try {
      await accept.mutateAsync({ email: request.email, roleId: values.roleId });
      onAccepted();
      onClose();
    } catch {
      form.setError("root", { message: t.requestAcceptError });
    }
  }

  function handleClose(): void {
    if (busy) return;
    onClose();
  }

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      labelledBy="accept-request-title"
      size="sm"
    >
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-5 space-y-4"
        >
          <div>
            <h2
              id="accept-request-title"
              className="text-base font-medium text-(--color-text)"
            >
              {t.requestAcceptDialogTitle}
            </h2>
            <p className="text-xs text-(--color-text-muted) mt-1">
              {t.requestAcceptDialogDescr}
            </p>
          </div>
          <div className="text-sm">
            <p className="text-(--color-text-muted) text-xs uppercase tracking-wider">
              Email
            </p>
            <p className="text-(--color-text) mt-1 font-mono">
              {request?.email ?? ""}
            </p>
          </div>
          <RHFSelect<FormValues>
            name="roleId"
            label={t.campoRuolo}
            options={roleOptions}
            disabled={busy}
          />
          {form.formState.errors.root?.message ? (
            <InlineError>{form.formState.errors.root.message}</InlineError>
          ) : null}
          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={busy}
            >
              {t.annulla}
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {t.requestAccept}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Dialog>
  );
}
