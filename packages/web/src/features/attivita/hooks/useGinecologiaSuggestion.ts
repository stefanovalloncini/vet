import { useEffect, useState } from "react";
import { GINECOLOGIA_TIPO_ID } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface Result {
  suggested: boolean;
  clear: () => void;
}

export function useGinecologiaSuggestion(args: {
  aziendaId: string;
  tipoId: string;
  isEdit: boolean;
  currentTariffa: string;
  onSuggest: (value: string) => void;
}): Result {
  const { attivita: repo } = useRepositories();
  const [suggested, setSuggested] = useState(false);

  useEffect(() => {
    if (args.isEdit) return;
    if (!args.aziendaId || args.tipoId !== GINECOLOGIA_TIPO_ID) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.aziendaId, args.tipoId, args.isEdit, repo]);

  return {
    suggested,
    clear: () => setSuggested(false),
  };
}
