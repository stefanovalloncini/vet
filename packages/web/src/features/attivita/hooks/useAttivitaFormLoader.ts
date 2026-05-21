import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Attivita, AttivitaRepository } from "@vet/shared";
import { dateInputValue } from "../lib/format";
import type { AttivitaFormState } from "../ui/AttivitaFormFields";

interface UseAttivitaFormLoaderArgs {
  id: string | undefined;
  cloneId: string | null;
  presetDate: string | null;
  repo: AttivitaRepository;
}

export interface AttivitaFormLoaderResult {
  form: AttivitaFormState;
  setForm: React.Dispatch<React.SetStateAction<AttivitaFormState>>;
  loaded: Attivita | null;
  loading: boolean;
}

function emptyForm(presetDate: string | null): AttivitaFormState {
  return {
    data: presetDate ?? dateInputValue(new Date()),
    aziendaId: "",
    tipoId: "",
    oraria: false,
    tariffa: "",
    ore: "",
    note: "",
    reminderAt: "",
    reminderTitle: "",
  };
}

function formFromAttivita(a: Attivita, isEdit: boolean): AttivitaFormState {
  return {
    data: isEdit ? dateInputValue(a.data) : dateInputValue(new Date()),
    aziendaId: a.aziendaId,
    tipoId: a.tipoId,
    oraria: a.oraria,
    tariffa: String(a.tariffa),
    ore: a.ore !== undefined ? String(a.ore) : "",
    note: isEdit ? a.note ?? "" : "",
    reminderAt: "",
    reminderTitle: "",
  };
}

export function useAttivitaFormLoader({
  id,
  cloneId,
  presetDate,
  repo,
}: UseAttivitaFormLoaderArgs): AttivitaFormLoaderResult {
  const navigate = useNavigate();
  const isEdit = id !== undefined;
  const targetId = id ?? cloneId;
  const [form, setForm] = useState<AttivitaFormState>(() => emptyForm(presetDate));
  const [loaded, setLoaded] = useState<Attivita | null>(null);
  const [loading, setLoading] = useState<boolean>(isEdit || cloneId !== null);

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    void (async () => {
      const a = await repo.getById(targetId);
      if (cancelled) return;
      if (!a) {
        navigate("/attivita", { replace: true });
        return;
      }
      if (isEdit) setLoaded(a);
      setForm(formFromAttivita(a, isEdit));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [targetId, isEdit, navigate, repo]);

  return { form, setForm, loaded, loading };
}
