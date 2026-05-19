import { useEffect, useState } from "react";
import { GINECOLOGIA_TIPO_ID, type ActivityType } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface Result {
  suggested: boolean;
  clear: () => void;
}

export function useTariffaSuggestion(args: {
  aziendaId: string;
  tipoId: string;
  tipi: ActivityType[];
  isEdit: boolean;
  currentTariffa: string;
  onSuggest: (value: string) => void;
}): Result {
  const { attivita: repo } = useRepositories();
  const [suggested, setSuggested] = useState(false);

  useEffect(() => {
    if (args.isEdit) return;
    if (!args.tipoId) {
      setSuggested(false);
      return;
    }
    if (args.tipoId === GINECOLOGIA_TIPO_ID) {
      if (!args.aziendaId) {
        setSuggested(false);
        return;
      }
      let cancelled = false;
      void (async () => {
        const last = await repo.findLastByAziendaAndTipo(
          args.aziendaId,
          GINECOLOGIA_TIPO_ID
        );
        if (cancelled) return;
        if (last) {
          if (args.currentTariffa === "") {
            args.onSuggest(String(last.tariffa));
          }
          setSuggested(true);
        } else {
          setSuggested(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    const tipo = args.tipi.find((t) => t.id === args.tipoId);
    if (tipo?.tariffaStandard !== undefined) {
      if (args.currentTariffa === "") {
        args.onSuggest(String(tipo.tariffaStandard));
      }
      setSuggested(true);
    } else {
      setSuggested(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.aziendaId, args.tipoId, args.isEdit, args.tipi, repo]);

  return {
    suggested,
    clear: () => setSuggested(false),
  };
}
