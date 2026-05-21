import { useEffect, useMemo, useState } from "react";
import {
  attivitaInputSchema,
  GINECOLOGIA_TIPO_ID,
  type ActorContext,
  type Attivita,
  type AttivitaInput,
  type AttivitaRepository,
} from "@vet/shared";
import { dateInputValue, formatEuro } from "../../attivita/lib/format";
import { isTariffaOutOfRange, meanTariffaByTipo } from "../lib/tariffStats";
import type { ReferenceData } from "../../attivita/hooks/useReferenceData";

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
  const [data, setData] = useState<string>(() => dateInputValue(new Date()));
  const [aziendaId, setAziendaId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [tariffa, setTariffa] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [items, setItems] = useState<Attivita[]>([]);
  const [skipDupCheck, setSkipDupCheck] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const recent = await attivita.list();
        if (cancelled) return;
        setItems(recent);
        const order: string[] = [];
        for (const a of recent) {
          if (!order.includes(a.aziendaId)) order.push(a.aziendaId);
          if (order.length >= RECENT_AZIENDE_LIMIT) break;
        }
        setRecentIds(order);
      } catch {
        if (cancelled) return;
        setItems([]);
        setRecentIds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, attivita]);

  useEffect(() => {
    if (!open || !tipoId || tariffa) return;
    if (tipoId === GINECOLOGIA_TIPO_ID) {
      if (!aziendaId) return;
      let cancelled = false;
      void (async () => {
        const last = await attivita.findLastByAziendaAndTipo(
          aziendaId,
          GINECOLOGIA_TIPO_ID
        );
        if (cancelled || !last) return;
        setTariffa(String(last.tariffa));
      })();
      return () => {
        cancelled = true;
      };
    }
    const tipo = ref.tipi.find((t) => t.id === tipoId);
    if (tipo?.tariffaStandard !== undefined) {
      setTariffa(String(tipo.tariffaStandard));
    }
    return undefined;
  }, [aziendaId, tipoId, tariffa, open, attivita, ref.tipi]);

  useEffect(() => {
    setSkipDupCheck(false);
  }, [aziendaId, tipoId, data]);

  const tariffaNum = tariffa.trim() === "" ? null : Number(tariffa);
  const candidateDate = useMemo(() => new Date(`${data}T00:00:00`), [data]);
  const meanByTipo = useMemo(() => meanTariffaByTipo(items), [items]);

  const rangeMean = useMemo(
    () => isTariffaOutOfRange({ tariffa: tariffaNum, tipoId, meanByTipo }),
    [tariffaNum, tipoId, meanByTipo]
  );
  const rangeWarning = rangeMean === null
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

  function reset(opts: { keepDate?: boolean } = {}): void {
    if (!opts.keepDate) setData(dateInputValue(new Date()));
    setAziendaId("");
    setTipoId("");
    setTariffa("");
    setError(null);
    setSkipDupCheck(false);
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
      setError(parsed.error.issues[0]?.message ?? "Dati non validi");
      return null;
    }
    const azienda = ref.aziende.find((a) => a.id === aziendaId);
    const tipo = ref.tipi.find((t) => t.id === tipoId);
    if (!azienda || !tipo) {
      setError("Cliente o tipo non valido");
      return null;
    }
    if (duplicateExists && !skipDupCheck) {
      setError(
        "Esiste già un'attività identica oggi. Premi Salva di nuovo per confermare."
      );
      setSkipDupCheck(true);
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      const input: AttivitaInput = parsed.data;
      return await attivita.create(
        input,
        { aziendaNome: azienda.nome, tipoNome: tipo.nome },
        user
      );
    } catch (err) {
      console.error("quick entry save failed", err);
      setError("Salvataggio non riuscito");
      return null;
    } finally {
      setBusy(false);
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
    busy,
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
