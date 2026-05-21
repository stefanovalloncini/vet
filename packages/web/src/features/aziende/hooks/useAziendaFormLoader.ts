import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Azienda, AziendeRepository } from "@vet/shared";
import { emptyAziendaForm, type AziendaFormState } from "../ui/AziendaFormFields";

interface UseAziendaFormLoaderArgs {
  id: string | undefined;
  repo: AziendeRepository;
}

export interface AziendaFormLoaderResult {
  form: AziendaFormState;
  setForm: React.Dispatch<React.SetStateAction<AziendaFormState>>;
  loaded: Azienda | null;
  loading: boolean;
}

function formFromAzienda(a: Azienda): AziendaFormState {
  return {
    nome: a.nome,
    indirizzo: a.indirizzo ?? "",
    telefono: a.telefono ?? "",
    piva: a.piva ?? "",
    emailFatturazione: a.emailFatturazione ?? "",
    cadenzaFatturazione: a.cadenzaFatturazione ?? "",
    tipoAllevamento: a.tipoAllevamento ?? "",
    numeroCapi: a.numeroCapi !== undefined ? String(a.numeroCapi) : "",
    note: a.note ?? "",
  };
}

export function useAziendaFormLoader({
  id,
  repo,
}: UseAziendaFormLoaderArgs): AziendaFormLoaderResult {
  const navigate = useNavigate();
  const isEdit = id !== undefined;
  const [form, setForm] = useState<AziendaFormState>(emptyAziendaForm);
  const [loaded, setLoaded] = useState<Azienda | null>(null);
  const [loading, setLoading] = useState<boolean>(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    void (async () => {
      const a = await repo.getById(id);
      if (cancelled) return;
      if (!a) {
        navigate("/aziende", { replace: true });
        return;
      }
      setLoaded(a);
      setForm(formFromAzienda(a));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate, repo]);

  return { form, setForm, loaded, loading };
}
