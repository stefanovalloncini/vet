import {
  Card,
  Select,
  TextArea,
  TextField,
} from "../../../shared/ui";
import { aziendeI18n as t } from "../i18n";
import type {
  CadenzaFatturazione,
  TipoAllevamento,
} from "@vet/shared";

export interface AziendaFormState {
  nome: string;
  indirizzo: string;
  telefono: string;
  piva: string;
  emailFatturazione: string;
  cadenzaFatturazione: CadenzaFatturazione | "";
  tipoAllevamento: TipoAllevamento | "";
  numeroCapi: string;
  note: string;
}

export const emptyAziendaForm: AziendaFormState = {
  nome: "",
  indirizzo: "",
  telefono: "",
  piva: "",
  emailFatturazione: "",
  cadenzaFatturazione: "",
  tipoAllevamento: "",
  numeroCapi: "",
  note: "",
};

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

interface AziendaFormFieldsProps {
  form: AziendaFormState;
  errors: Partial<Record<keyof AziendaFormState, string>>;
  busy: boolean;
  onUpdate: <K extends keyof AziendaFormState>(
    key: K,
    value: AziendaFormState[K]
  ) => void;
}

export function AziendaFormFields({
  form,
  errors,
  busy,
  onUpdate,
}: AziendaFormFieldsProps) {
  return (
    <Card>
      <div className="space-y-5">
        <TextField
          id="nome"
          label={t.campoNome}
          value={form.nome}
          onChange={(e) => onUpdate("nome", e.target.value)}
          required
          hint={t.campoNomeHint}
          error={errors.nome}
          disabled={busy}
          autoFocus
          maxLength={200}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <TextField
            id="indirizzo"
            label={t.campoIndirizzo}
            value={form.indirizzo}
            onChange={(e) => onUpdate("indirizzo", e.target.value)}
            error={errors.indirizzo}
            disabled={busy}
            maxLength={300}
          />
          <TextField
            id="telefono"
            label={t.campoTelefono}
            value={form.telefono}
            onChange={(e) => onUpdate("telefono", e.target.value)}
            error={errors.telefono}
            disabled={busy}
            maxLength={40}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Select
            id="tipo-allevamento"
            label={t.campoTipoAllevamento}
            value={form.tipoAllevamento}
            onChange={(e) =>
              onUpdate(
                "tipoAllevamento",
                (e.target.value as TipoAllevamento | "") ?? ""
              )
            }
            options={TIPO_OPTIONS}
            disabled={busy}
          />
          <TextField
            id="numero-capi"
            type="number"
            min="0"
            max="100000"
            step="1"
            label={t.campoNumeroCapi}
            value={form.numeroCapi}
            onChange={(e) => onUpdate("numeroCapi", e.target.value)}
            error={errors.numeroCapi}
            disabled={busy}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <TextField
            id="piva"
            label={t.campoPiva}
            value={form.piva}
            onChange={(e) => onUpdate("piva", e.target.value)}
            error={errors.piva}
            disabled={busy}
            maxLength={13}
            placeholder="12345678903"
          />
          <Select
            id="cadenza"
            label={t.campoCadenza}
            value={form.cadenzaFatturazione}
            onChange={(e) =>
              onUpdate(
                "cadenzaFatturazione",
                (e.target.value as CadenzaFatturazione | "") ?? ""
              )
            }
            options={CADENZA_OPTIONS}
            disabled={busy}
          />
        </div>
        <TextField
          id="email-fatturazione"
          type="email"
          label={t.campoEmailFatturazione}
          value={form.emailFatturazione}
          onChange={(e) => onUpdate("emailFatturazione", e.target.value)}
          error={errors.emailFatturazione}
          disabled={busy}
          maxLength={120}
        />
        <TextArea
          id="note"
          label={t.campoNote}
          value={form.note}
          onChange={(e) => onUpdate("note", e.target.value)}
          error={errors.note}
          disabled={busy}
          maxLength={1000}
        />
      </div>
    </Card>
  );
}
