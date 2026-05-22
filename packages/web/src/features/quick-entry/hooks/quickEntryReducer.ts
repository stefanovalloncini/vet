import {
  GINECOLOGIA_TIPO_ID,
  type ActivityType,
} from "@vet/shared";
import { dateInputValue } from "../../attivita/lib/format";

export interface QuickEntryFields {
  data: string;
  aziendaId: string;
  tipoId: string;
  tariffa: string;
  skipDupCheck: boolean;
  error: string | null;
}

export type QuickEntryAction =
  | { type: "set-data"; value: string }
  | { type: "set-azienda"; value: string }
  | { type: "set-tipo"; value: string; defaultTariffa: string | null }
  | { type: "set-tariffa"; value: string }
  | { type: "set-error"; value: string | null }
  | { type: "arm-dup-skip" }
  | { type: "reset"; keepDate: boolean };

export function initialQuickEntryFields(): QuickEntryFields {
  return {
    data: dateInputValue(new Date()),
    aziendaId: "",
    tipoId: "",
    tariffa: "",
    skipDupCheck: false,
    error: null,
  };
}

export function quickEntryReducer(
  state: QuickEntryFields,
  action: QuickEntryAction
): QuickEntryFields {
  switch (action.type) {
    case "set-data":
      if (action.value === state.data) return state;
      return { ...state, data: action.value, skipDupCheck: false };
    case "set-azienda":
      if (action.value === state.aziendaId) return state;
      return { ...state, aziendaId: action.value, skipDupCheck: false };
    case "set-tipo": {
      if (action.value === state.tipoId) return state;
      const tariffa =
        state.tariffa === "" && action.defaultTariffa !== null
          ? action.defaultTariffa
          : state.tariffa;
      return {
        ...state,
        tipoId: action.value,
        tariffa,
        skipDupCheck: false,
      };
    }
    case "set-tariffa":
      return { ...state, tariffa: action.value };
    case "set-error":
      return { ...state, error: action.value };
    case "arm-dup-skip":
      return { ...state, skipDupCheck: true };
    case "reset": {
      const fresh = initialQuickEntryFields();
      return action.keepDate ? { ...fresh, data: state.data } : fresh;
    }
  }
}

export function defaultTariffaForTipo(
  tipoId: string,
  tipi: ReadonlyArray<ActivityType>
): string | null {
  if (!tipoId || tipoId === GINECOLOGIA_TIPO_ID) return null;
  const tipo = tipi.find((t) => t.id === tipoId);
  return tipo?.tariffaStandard !== undefined ? String(tipo.tariffaStandard) : null;
}
