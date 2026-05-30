import { useEffect, useRef, useState } from "react";
import type { ActivityType } from "@vet/shared";
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
  const [lastSuggested, setLastSuggested] = useState<string | null>(null);
  const onSuggestRef = useRef(args.onSuggest);
  onSuggestRef.current = args.onSuggest;
  const currentTariffaRef = useRef(args.currentTariffa);
  currentTariffaRef.current = args.currentTariffa;

  const lastQuery = useLastAttivitaByAziendaAndTipo(
    args.aziendaId,
    args.tipoId,
    { enabled: !args.isEdit && !!args.aziendaId && !!args.tipoId }
  );

  useEffect(() => {
    if (args.isEdit) return;
    if (!args.tipoId) {
      setLastSuggested(null);
      return;
    }
    if (args.aziendaId && (lastQuery.isPending || lastQuery.isFetching)) return;
    const last = args.aziendaId ? lastQuery.data : null;
    const tipo = args.tipi.find((t) => t.id === args.tipoId);
    const value =
      last?.tariffa !== undefined
        ? String(last.tariffa)
        : tipo?.tariffaStandard !== undefined
          ? String(tipo.tariffaStandard)
          : null;
    if (value === null) {
      setLastSuggested(null);
      return;
    }
    if (currentTariffaRef.current === "") {
      onSuggestRef.current(value);
    }
    setLastSuggested(value);
  }, [
    args.aziendaId,
    args.tipoId,
    args.isEdit,
    args.tipi,
    lastQuery.data,
    lastQuery.isPending,
    lastQuery.isFetching,
  ]);

  const suggested =
    lastSuggested !== null && args.currentTariffa === lastSuggested;

  return {
    suggested,
    clear: () => setLastSuggested(null),
  };
}
