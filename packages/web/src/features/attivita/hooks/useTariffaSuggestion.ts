import { useEffect, useRef, useState } from "react";
import { GINECOLOGIA_TIPO_ID, type ActivityType } from "@vet/shared";
import { useLastAttivitaByAziendaAndTipo } from "./useAttivita";

interface Result {
  suggested: boolean;
  clear: () => void;
}

interface Args {
  aziendaId: string;
  tipoId: string;
  tipi: ActivityType[];
  isEdit: boolean;
  currentTariffa: string;
  onSuggest: (value: string) => void;
}

export function useTariffaSuggestion(args: Args): Result {
  const [suggested, setSuggested] = useState(false);
  const onSuggestRef = useRef(args.onSuggest);
  onSuggestRef.current = args.onSuggest;
  const currentTariffaRef = useRef(args.currentTariffa);
  currentTariffaRef.current = args.currentTariffa;

  const isGin = args.tipoId === GINECOLOGIA_TIPO_ID;
  const ginQuery = useLastAttivitaByAziendaAndTipo(
    args.aziendaId,
    args.tipoId,
    { enabled: !args.isEdit && isGin && !!args.aziendaId }
  );

  useEffect(() => {
    if (args.isEdit) return;
    if (!args.tipoId) {
      setSuggested(false);
      return;
    }
    if (isGin) {
      if (!args.aziendaId || ginQuery.isPending || ginQuery.isFetching) return;
      const last = ginQuery.data;
      if (last) {
        if (currentTariffaRef.current === "") {
          onSuggestRef.current(String(last.tariffa));
        }
        setSuggested(true);
      } else {
        setSuggested(false);
      }
      return;
    }
    const tipo = args.tipi.find((t) => t.id === args.tipoId);
    if (tipo?.tariffaStandard !== undefined) {
      if (currentTariffaRef.current === "") {
        onSuggestRef.current(String(tipo.tariffaStandard));
      }
      setSuggested(true);
    } else {
      setSuggested(false);
    }
  }, [
    args.aziendaId,
    args.tipoId,
    args.isEdit,
    args.tipi,
    isGin,
    ginQuery.data,
    ginQuery.isPending,
    ginQuery.isFetching,
  ]);

  return {
    suggested,
    clear: () => setSuggested(false),
  };
}
