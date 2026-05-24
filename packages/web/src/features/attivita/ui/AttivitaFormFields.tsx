import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Card, SectionLabel } from "../../../shared/ui";
import { RHFSelect, RHFTextArea, RHFTextField } from "../../../shared/ui/rhf";
import { attivitaI18n as t } from "../i18n";
import { formatEuro } from "../lib/format";
import type { AttivitaFormValues } from "../lib/formSchema";
import { AttivitaReminderField } from "./AttivitaReminderField";

interface AttivitaFormFieldsProps {
  busy: boolean;
  isEdit: boolean;
  tariffaSuggested: boolean;
  totaleLive: number | null;
  aziendaOptions: ReadonlyArray<{ value: string; label: string }>;
  tipoOptions: ReadonlyArray<{ value: string; label: string }>;
  aziendaAction?: ReactNode;
  tipoAction?: ReactNode;
}

export function AttivitaFormFields({
  busy,
  isEdit,
  tariffaSuggested,
  totaleLive,
  aziendaOptions,
  tipoOptions,
  aziendaAction,
  tipoAction,
}: AttivitaFormFieldsProps) {
  const { control, register, setValue } = useFormContext<AttivitaFormValues>();
  const oraria = useWatch({ control, name: "oraria" });

  return (
    <Card>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <RHFTextField<AttivitaFormValues>
            name="data"
            type="date"
            label={t.campoData}
            required
            disabled={busy}
          />
          <RHFSelect<AttivitaFormValues>
            name="aziendaId"
            label={t.campoAzienda}
            options={aziendaOptions}
            disabled={busy}
            action={aziendaAction}
          />
        </div>
        <RHFSelect<AttivitaFormValues>
          name="tipoId"
          label={t.campoTipo}
          options={tipoOptions}
          disabled={busy}
          action={tipoAction}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register("oraria", {
              onChange: (e) => {
                if (!(e.target as HTMLInputElement).checked) {
                  setValue("ore", "", { shouldValidate: false });
                }
              },
            })}
            disabled={busy}
            className="w-4 h-4 accent-(--color-accent)"
          />
          <span className="text-sm text-(--color-text)">{t.campoOraria}</span>
        </label>
        <p className="text-xs text-(--color-text-subtle) -mt-3 ml-7">
          {t.campoOrariaHint}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <RHFTextField<AttivitaFormValues>
            name="tariffa"
            type="number"
            step="10"
            min="1"
            max="100000"
            label={t.campoTariffa}
            required
            disabled={busy}
            {...(tariffaSuggested ? { hint: t.ginecologiaSuggerita } : {})}
          />
          {oraria ? (
            <RHFTextField<AttivitaFormValues>
              name="ore"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              label={t.campoOre}
              required
              disabled={busy}
            />
          ) : null}
        </div>

        <RHFTextArea<AttivitaFormValues>
          name="note"
          label={t.campoNote}
          disabled={busy}
          maxLength={2000}
        />

        {!isEdit ? <AttivitaReminderField busy={busy} /> : null}

        {totaleLive !== null ? (
          <div className="flex items-baseline justify-between pt-2 border-t border-(--color-border)">
            <SectionLabel as="span">{t.totale}</SectionLabel>
            <span className="text-2xl font-medium text-(--color-text) tabular-nums">
              {formatEuro(totaleLive)}
            </span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
