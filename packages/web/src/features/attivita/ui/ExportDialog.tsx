import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Dialog, InlineError } from "../../../shared/ui";
import { RHFSelect, RHFTextField } from "../../../shared/ui/rhf";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useReferenceData } from "../hooks/useReferenceData";
import { attivitaI18n as t } from "../i18n";
import { csvFilename, downloadCsv, toCsvItalian } from "../lib/csv";
import { parseDateInput } from "../../../shared/lib/format";

const formSchema = z.object({
  from: z.string(),
  to: z.string(),
  aziendaId: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onClose: () => void;
}

export function ExportDialog({ onClose }: Props) {
  const { attivita: repo } = useRepositories();
  const ref = useReferenceData();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { from: "", to: "", aziendaId: "" },
    mode: "onSubmit",
  });
  const busy = form.formState.isSubmitting;
  const rootError = form.formState.errors.root?.message;

  async function onSubmit(values: FormValues) {
    form.clearErrors("root");
    try {
      const filters: { from?: Date; to?: Date; aziendaId?: string } = {};
      const fromDate = parseDateInput(values.from);
      const toDate = parseDateInput(values.to);
      if (fromDate) filters.from = fromDate;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filters.to = end;
      }
      if (values.aziendaId) filters.aziendaId = values.aziendaId;
      const items = await repo.list(filters);
      if (items.length === 0) {
        form.setError("root", { message: t.esportaNessunDato });
        return;
      }
      const csv = toCsvItalian(items);
      const aziendaNome = values.aziendaId
        ? ref.aziende.find((a) => a.id === values.aziendaId)?.nome
        : undefined;
      const filename = csvFilename({
        ...(aziendaNome ? { aziendaNome } : {}),
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
      });
      downloadCsv(filename, csv);
      onClose();
    } catch {
      form.setError("root", { message: t.esportaErrore });
    }
  }

  const aziendaOptions = [
    { value: "", label: t.filtroTutti },
    ...ref.aziende.map((a) => ({ value: a.id, label: a.nome })),
  ];

  return (
    <Dialog open onClose={onClose} labelledBy="export-dialog-title" size="md">
      <FormProvider {...form}>
        <div className="p-5">
          <h2
            id="export-dialog-title"
            className="text-base font-medium text-(--color-text)"
          >
            {t.esportaTitolo}
          </h2>
          <p className="text-sm text-(--color-text-muted) mt-2">
            {t.esportaDescr}
          </p>
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-5"
          >
            <div className="grid grid-cols-2 gap-3">
              <RHFTextField<FormValues>
                name="from"
                type="date"
                label={t.filtroDataDa}
                disabled={busy}
              />
              <RHFTextField<FormValues>
                name="to"
                type="date"
                label={t.filtroDataA}
                disabled={busy}
              />
            </div>
            <RHFSelect<FormValues>
              name="aziendaId"
              label={t.filtroAzienda}
              options={aziendaOptions}
              disabled={busy}
            />
            {rootError ? <InlineError>{rootError}</InlineError> : null}
            <div className="flex items-center justify-end gap-3 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={busy}
              >
                {t.annulla}
              </Button>
              <Button type="submit" variant="primary" disabled={busy}>
                {t.esportaScarica}
              </Button>
            </div>
          </form>
        </div>
      </FormProvider>
    </Dialog>
  );
}
