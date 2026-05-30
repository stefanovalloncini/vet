import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Card, SectionLabel } from "../../../shared/ui";
import {
  RHFNumberField,
  RHFSelect,
  RHFTextArea,
  RHFTextField,
} from "../../../shared/ui/rhf";
import { attivitaI18n as t } from "../i18n";
import { formatEuro } from "../../../shared/lib/format";
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
  const { control } = useFormContext<AttivitaFormValues>();
  const oraria = useWatch({ control, name: "oraria" });
  const adElemento = useWatch({ control, name: "adElemento" });

  return (
    <Card>
      <div className="space-y-7">
        <Section legend={t.sezioneDati} first>
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
          <RHFTextArea<AttivitaFormValues>
            name="note"
            label={t.campoNote}
            rows={2}
            disabled={busy}
            maxLength={2000}
          />
        </Section>

        <Section legend={t.sezioneTariffa}>
          <RateModeToggles busy={busy} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <RHFNumberField<AttivitaFormValues>
              name="tariffa"
              label={t.campoTariffa}
              step={10}
              min={0}
              max={100000}
              disabled={busy}
              {...(tariffaSuggested ? { hint: t.tariffaSuggerita } : {})}
            />
            {oraria ? (
              <RHFTextField<AttivitaFormValues>
                name="ore"
                type="number"
                inputMode="decimal"
                step="0.25"
                min="0.25"
                max="24"
                label={t.campoOre}
                required
                disabled={busy}
              />
            ) : null}
            {adElemento ? (
              <RHFTextField<AttivitaFormValues>
                name="elementi"
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                max="10000"
                label={t.campoElementi}
                required
                disabled={busy}
              />
            ) : null}
          </div>
          {totaleLive !== null ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-3 border-t border-(--color-border)">
              <SectionLabel as="span">{t.totale}</SectionLabel>
              <span className="text-2xl font-medium text-(--color-text) tabular-nums tracking-tight">
                {formatEuro(totaleLive)}
              </span>
            </div>
          ) : null}
        </Section>

        {!isEdit ? (
          <Section legend={t.sezionePromemoria}>
            <AttivitaReminderField busy={busy} />
          </Section>
        ) : null}
      </div>
    </Card>
  );
}

function Section({
  legend,
  first,
  children,
}: {
  legend: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={first ? "" : "border-t border-(--color-border) pt-6"}>
      <SectionLabel as="h2" className="mb-4 font-medium text-(--color-text)">
        {legend}
      </SectionLabel>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function RateModeToggles({ busy }: { busy: boolean }) {
  const { register, setValue } = useFormContext<AttivitaFormValues>();
  return (
    <fieldset className="space-y-1">
      <RateModeToggle
        label={t.campoOraria}
        hint={t.campoOrariaHint}
        disabled={busy}
        registration={register("oraria", {
          onChange: (e) => {
            const checked = (e.target as HTMLInputElement).checked;
            if (!checked) setValue("ore", "", { shouldValidate: false });
            if (checked) {
              setValue("adElemento", false, { shouldValidate: false });
              setValue("elementi", "", { shouldValidate: false });
            }
          },
        })}
      />
      <RateModeToggle
        label={t.campoAdElemento}
        hint={t.campoAdElementoHint}
        disabled={busy}
        registration={register("adElemento", {
          onChange: (e) => {
            const checked = (e.target as HTMLInputElement).checked;
            if (!checked) setValue("elementi", "", { shouldValidate: false });
            if (checked) {
              setValue("oraria", false, { shouldValidate: false });
              setValue("ore", "", { shouldValidate: false });
            }
          },
        })}
      />
    </fieldset>
  );
}

type Registration = ReturnType<
  ReturnType<typeof useFormContext<AttivitaFormValues>>["register"]
>;

function RateModeToggle({
  label,
  hint,
  disabled,
  registration,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  registration: Registration;
}) {
  return (
    <div>
      <label className="flex min-h-11 items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...registration}
          disabled={disabled}
          className="w-4 h-4 shrink-0 accent-(--color-accent)"
        />
        <span className="text-sm text-(--color-text)">{label}</span>
      </label>
      <p className="text-xs text-(--color-text-subtle) ml-7 -mt-1">{hint}</p>
    </div>
  );
}
