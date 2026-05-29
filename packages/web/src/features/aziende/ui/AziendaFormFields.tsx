import { Card } from "../../../shared/ui";
import { FieldGroup } from "../../../shared/ui/forms/FieldGroup";
import { RHFSelect, RHFTextArea, RHFTextField } from "../../../shared/ui/rhf";
import { aziendeI18n as t } from "../i18n";
import type { AziendaFormValues } from "../lib/formSchema";

const CADENZA_OPTIONS = [
  { value: "", label: t.campoCadenzaNessuna },
  { value: "monthly", label: t.campoCadenzaMensile },
  { value: "quarterly", label: t.campoCadenzaTrimestrale },
  { value: "semiannual", label: t.campoCadenzaSemestrale },
];

const TIPO_OPTIONS = [
  { value: "", label: t.campoTipoNessuno },
  { value: "bovini", label: t.tipoBovini },
  { value: "ovini", label: t.tipoOvini },
  { value: "caprini", label: t.tipoCaprini },
  { value: "suini", label: t.tipoSuini },
  { value: "avicoli", label: t.tipoAvicoli },
  { value: "equini", label: t.tipoEquini },
  { value: "misto", label: t.tipoMisto },
  { value: "altro", label: t.tipoAltro },
];

export function AziendaFormFields({ busy }: { busy: boolean }) {
  return (
    <Card>
      <div className="space-y-8">
        <FieldGroup legend={t.gruppoAnagrafica}>
          <RHFTextField<AziendaFormValues>
            name="nome"
            label={t.campoNome}
            hint={t.campoNomeHint}
            required
            disabled={busy}
            autoFocus
            maxLength={200}
          />
          <RHFTextField<AziendaFormValues>
            name="indirizzo"
            label={t.campoIndirizzo}
            disabled={busy}
            maxLength={300}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <RHFSelect<AziendaFormValues>
              name="tipoAllevamento"
              label={t.campoTipoAllevamento}
              options={TIPO_OPTIONS}
              disabled={busy}
            />
            <RHFTextField<AziendaFormValues>
              name="numeroCapi"
              type="number"
              inputMode="numeric"
              min={0}
              max={100000}
              step={1}
              label={t.campoNumeroCapi}
              disabled={busy}
            />
          </div>
        </FieldGroup>

        <FieldGroup legend={t.gruppoContatti} layout="grid-2">
          <RHFTextField<AziendaFormValues>
            name="telefono"
            label={t.campoTelefono}
            inputMode="tel"
            disabled={busy}
            maxLength={40}
          />
          <RHFTextField<AziendaFormValues>
            name="emailFatturazione"
            type="email"
            inputMode="email"
            label={t.campoEmailFatturazione}
            disabled={busy}
            maxLength={120}
          />
        </FieldGroup>

        <FieldGroup legend={t.gruppoFatturazione}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <RHFTextField<AziendaFormValues>
              name="piva"
              label={t.campoPiva}
              inputMode="numeric"
              disabled={busy}
              maxLength={13}
              placeholder="12345678903"
            />
            <RHFSelect<AziendaFormValues>
              name="cadenzaFatturazione"
              label={t.campoCadenza}
              options={CADENZA_OPTIONS}
              disabled={busy}
            />
          </div>
          <RHFTextField<AziendaFormValues>
            name="armadiettoCanoneAnnuo"
            type="number"
            inputMode="decimal"
            min={0}
            max={100000}
            step="0.01"
            label={t.campoArmadietto}
            hint={t.campoArmadiettoHint}
            disabled={busy}
          />
          <RHFTextArea<AziendaFormValues>
            name="note"
            label={t.campoNote}
            disabled={busy}
            maxLength={1000}
          />
        </FieldGroup>
      </div>
    </Card>
  );
}
