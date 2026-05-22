import { useEffect, useMemo, useReducer } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  attivitaInputSchema,
  GINECOLOGIA_TIPO_ID,
  type ActorContext,
  type Attivita,
  type AttivitaInput,
  type AttivitaRepository,
} from "@vet/shared";
import { formatEuro } from "../../attivita/lib/format";
import { useCreateAttivita } from "../../attivita/hooks/useAttivita";
import { queryKeys } from "../../../shared/data/queryClient";
import { isTariffaOutOfRange, meanTariffaByTipo } from "../lib/tariffStats";
import type { ReferenceData } from "../../attivita/hooks/useReferenceData";
import {
  defaultTariffaForTipo,
  initialQuickEntryFields,
  quickEntryReducer,
} from "./quickEntryReducer";

const RECENT_AZIENDE_LIMIT = 6;

interface Option {
  value: string;
  label: string;
}

export interface QuickEntryFormState {
  data: string;
  setData: (next: string) => void;
  aziendaId: string;
  setAziendaId: (next: string) => void;
  tipoId: string;
  setTipoId: (next: string) => void;
  tariffa: string;
  setTariffa: (next: string) => void;
  busy: boolean;
  error: string | null;
  rangeWarning: string | null;
  duplicateExists: boolean;
  tariffaNum: number | null;
  aziendaOptions: ReadonlyArray<Option>;
  tipoOptions: ReadonlyArray<Option>;
  reset: (opts?: { keepDate?: boolean }) => void;
  save: () => Promise<string | null>;
}

interface UseQuickEntryFormArgs {
  open: boolean;
  user: ActorContext | null;
  attivita: AttivitaRepository;
  ref: ReferenceData;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function useQuickEntryForm({
  open,
  user,
  attivita,
  ref,
}: UseQuickEntryFormArgs): QuickEntryFormState {
  const createMutation = useCreateAttivita();
  const [fields, dispatch] = useReducer(
    quickEntryReducer,
    undefined,
    initialQuickEntryFields
  );
  const { data, aziendaId, tipoId, tariffa, skipDupCheck, error } = fields;

  const recentQuery = useQuery<Attivita[]>({
    queryKey: queryKeys.attivita(),
    queryFn: () => attivita.list(),
    enabled: open,
  });
  const items = useMemo(() => recentQuery.data ?? [], [recentQuery.data]);
  const recentIds = useMemo(() => {
    const order: string[] = [];
    for (const a of items) {
      if (!order.includes(a.aziendaId)) order.push(a.aziendaId);
      if (order.length >= RECENT_AZIENDE_LIMIT) break;
    }
    return order;
  }, [items]);

  useEffect(() => {
    if (!open) return;
    if (tipoId !== GINECOLOGIA_TIPO_ID) return;
    if (!aziendaId || tariffa) return;
    let cancelled = false;
    void (async () => {
      const last = await attivita.findLastByAziendaAndTipo(
        aziendaId,
        GINECOLOGIA_TIPO_ID
      );
      if (cancelled || !last) return;
      dispatch({ type: "set-tariffa", value: String(last.tariffa) });
    })();
    return () => {
      cancelled = true;
    };
  }, [aziendaId, tipoId, tariffa, open, attivita]);

  const tariffaNum = tariffa.trim() === "" ? null : Number(tariffa);
  const candidateDate = useMemo(() => new Date(`${data}T00:00:00`), [data]);
  const meanByTipo = useMemo(() => meanTariffaByTipo(items), [items]);

  const rangeMean = useMemo(
    () => isTariffaOutOfRange({ tariffa: tariffaNum, tipoId, meanByTipo }),
    [tariffaNum, tipoId, meanByTipo]
  );
  const rangeWarning =
    rangeMean === null
      ? null
      : `Tariffa fuori dal range solito per questo tipo (media ${formatEuro(rangeMean)}).`;

  const duplicateExists = useMemo(() => {
    if (!aziendaId || !tipoId) return false;
    return items.some(
      (a) =>
        a.aziendaId === aziendaId &&
        a.tipoId === tipoId &&
        isSameDay(a.data, candidateDate)
    );
  }, [items, aziendaId, tipoId, candidateDate]);

  const aziendaOptions = useMemo<ReadonlyArray<Option>>(() => {
    const sorted = [...ref.aziende].sort((a, b) => {
      const ai = recentIds.indexOf(a.id);
      const bi = recentIds.indexOf(b.id);
      if (ai === -1 && bi === -1) return a.nome.localeCompare(b.nome, "it");
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return [
      { value: "", label: "Scegli azienda" },
      ...sorted.map((a) => ({
        value: a.id,
        label: recentIds.includes(a.id) ? `★ ${a.nome}` : a.nome,
      })),
    ];
  }, [ref.aziende, recentIds]);

  const tipoOptions = useMemo<ReadonlyArray<Option>>(
    () => [
      { value: "", label: "Scegli tipo" },
      ...ref.tipi.map((t) => ({ value: t.id, label: t.nome })),
    ],
    [ref.tipi]
  );

  function setData(value: string): void {
    dispatch({ type: "set-data", value });
  }

  function setAziendaId(value: string): void {
    dispatch({ type: "set-azienda", value });
  }

  function setTipoId(value: string): void {
    dispatch({
      type: "set-tipo",
      value,
      defaultTariffa: defaultTariffaForTipo(value, ref.tipi),
    });
  }

  function setTariffa(value: string): void {
    dispatch({ type: "set-tariffa", value });
  }

  function reset(opts: { keepDate?: boolean } = {}): void {
    dispatch({ type: "reset", keepDate: opts.keepDate ?? false });
  }

  async function save(): Promise<string | null> {
    if (!user) return null;
    const parsed = attivitaInputSchema.safeParse({
      data: candidateDate,
      aziendaId,
      tipoId,
      oraria: false,
      tariffa: Number(tariffa),
    });
    if (!parsed.success) {
      dispatch({
        type: "set-error",
        value: parsed.error.issues[0]?.message ?? "Dati non validi",
      });
      return null;
    }
    const azienda = ref.aziende.find((a) => a.id === aziendaId);
    const tipo = ref.tipi.find((t) => t.id === tipoId);
    if (!azienda || !tipo) {
      dispatch({ type: "set-error", value: "Cliente o tipo non valido" });
      return null;
    }
    if (duplicateExists && !skipDupCheck) {
      dispatch({
        type: "set-error",
        value:
          "Esiste già un'attività identica oggi. Premi Salva di nuovo per confermare.",
      });
      dispatch({ type: "arm-dup-skip" });
      return null;
    }
    dispatch({ type: "set-error", value: null });
    try {
      const input: AttivitaInput = parsed.data;
      const id = await createMutation.mutateAsync({
        input,
        denorm: { aziendaNome: azienda.nome, tipoNome: tipo.nome },
        actor: user,
      });
      return id;
    } catch (err) {
      console.error("quick entry save failed", err);
      dispatch({ type: "set-error", value: "Salvataggio non riuscito" });
      return null;
    }
  }

  return {
    data,
    setData,
    aziendaId,
    setAziendaId,
    tipoId,
    setTipoId,
    tariffa,
    setTariffa,
    busy: createMutation.isPending,
    error,
    rangeWarning,
    duplicateExists,
    tariffaNum,
    aziendaOptions,
    tipoOptions,
    reset,
    save,
  };
}
