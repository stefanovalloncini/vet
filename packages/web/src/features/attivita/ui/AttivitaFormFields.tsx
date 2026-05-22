import type { ReactNode } from "react";
import {
  Card,
  SectionLabel,
  Select,
  TextArea,
  TextField,
} from "../../../shared/ui";
import { attivitaI18n as t } from "../i18n";
import { formatEuro } from "../lib/format";
import { AttivitaReminderField } from "./AttivitaReminderField";

export interface AttivitaFormState {
  data: string;
  aziendaId: string;
  tipoId: string;
  oraria: boolean;
  tariffa: string;
  ore: string;
  note: string;
  reminderAt: string;
  reminderTitle: string;
}

interface AttivitaFormFieldsProps {
  form: AttivitaFormState;
  errors: Partial<Record<keyof AttivitaFormState, string>>;
  busy: boolean;
  isEdit: boolean;
  tariffaSuggested: boolean;
  totaleLive: number | null;
  aziendaOptions: ReadonlyArray<{ value: string; label: string }>;
  tipoOptions: ReadonlyArray<{ value: string; label: string }>;
  aziendaAction?: ReactNode;
  tipoAction?: ReactNode;
  onUpdate: <K extends keyof AttivitaFormState>(
    key: K,
    value: AttivitaFormState[K]
  ) => void;
  onTariffaInput: (value: string) => void;
}

export function AttivitaFormFields({
  form,
  errors,
  busy,
  isEdit,
  tariffaSuggested,
  totaleLive,
  aziendaOptions,
  tipoOptions,
  aziendaAction,
  tipoAction,
  onUpdate,
  onTariffaInput,
}: AttivitaFormFieldsProps) {
  return (
    <Card>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <TextField
            id="data"
            type="date"
            label={t.campoData}
            value={form.data}
            onChange={(e) => onUpdate("data", e.target.value)}
            required
            error={errors.data}
            disabled={busy}
          />
          <Select
            id="azienda"
            label={t.campoAzienda}
            value={form.aziendaId}
            onChange={(e) => onUpdate("aziendaId", e.target.value)}
            options={aziendaOptions}
            error={errors.aziendaId}
            disabled={busy}
            action={aziendaAction}
          />
        </div>
        <Select
          id="tipo"
          label={t.campoTipo}
          value={form.tipoId}
          onChange={(e) => onUpdate("tipoId", e.target.value)}
          options={tipoOptions}
          error={errors.tipoId}
          disabled={busy}
          action={tipoAction}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.oraria}
            onChange={(e) => {
              onUpdate("oraria", e.target.checked);
              if (!e.target.checked) onUpdate("ore", "");
            }}
            disabled={busy}
            className="w-4 h-4 accent-(--color-accent)"
          />
          <span className="text-sm text-(--color-text)">{t.campoOraria}</span>
        </label>
        <p className="text-xs text-(--color-text-subtle) -mt-3 ml-7">
          {t.campoOrariaHint}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <TextField
            id="tariffa"
            type="number"
            step="0.01"
            min="0.01"
            max="100000"
            label={t.campoTariffa}
            value={form.tariffa}
            onChange={(e) => onTariffaInput(e.target.value)}
            required
            error={errors.tariffa}
            disabled={busy}
            hint={tariffaSuggested ? t.ginecologiaSuggerita : undefined}
          />
          {form.oraria ? (
            <TextField
              id="ore"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              label={t.campoOre}
              value={form.ore}
              onChange={(e) => onUpdate("ore", e.target.value)}
              required
              error={errors.ore}
              disabled={busy}
            />
          ) : null}
        </div>

        <TextArea
          id="note"
          label={t.campoNote}
          value={form.note}
          onChange={(e) => onUpdate("note", e.target.value)}
          error={errors.note}
          disabled={busy}
          maxLength={2000}
        />

        {!isEdit ? (
          <AttivitaReminderField
            reminderTitle={form.reminderTitle}
            reminderAt={form.reminderAt}
            busy={busy}
            onUpdate={onUpdate}
          />
        ) : null}

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
