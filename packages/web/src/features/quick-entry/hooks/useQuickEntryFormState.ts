import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  GINECOLOGIA_TIPO_ID,
  attivitaInputSchema,
  type ActorContext,
  type Attivita,
  type AttivitaInput,
  type AttivitaRepository,
} from "@vet/shared";
import {
  quickEntryFormSchema,
  type QuickEntryFormValues,
} from "../lib/quickEntryFormSchema";
import {
  dateInputValue,
  formatEuro,
  parseDateInput,
} from "../../../shared/lib/format";
import type { Option } from "../../../shared/lib/options";
import { queryKeys } from "../../../shared/data/queryClient";
import {
  useCreateAttivita,
  useLastAttivitaByAziendaAndTipo,
} from "../../attivita/hooks/useAttivita";
import type { ReferenceData } from "../../attivita/hooks/useReferenceData";
import {
  isTariffaOutOfRange,
  meanTariffaByTipo,
} from "../lib/tariffStats";
import {
  defaultTariffaForTipo,
  hasDuplicateAttivita,
  parseTariffa,
  sortTipiForQuickEntry,
} from "../lib/quickEntryHelpers";
import { computeCombos, type ComputeCombosResult } from "../lib/recentCombos";

const RECENT_AZIENDE_LIMIT = 6;

export type { QuickEntryFormValues };

export interface QuickEntryFormState {
  form: UseFormReturn<QuickEntryFormValues>;
  busy: boolean;
  tariffaNum: number | null;
  duplicateExists: boolean;
  rangeWarning: string | null;
  aziendaOptions: ReadonlyArray<Option>;
  tipoOptions: ReadonlyArray<Option>;
  combos: ComputeCombosResult;
  rootError: string | undefined;
  submit: (
    values: QuickEntryFormValues
  ) => Promise<{ ok: false } | { ok: true; id: string }>;
  resetAll: (over?: Partial<QuickEntryFormValues>) => void;
}

function defaultValues(): QuickEntryFormValues {
  return {
    data: dateInputValue(new Date()),
    aziendaId: "",
    tipoId: "",
    modalita: "fissa",
    tariffa: "",
    ore: "",
    elementi: "",
    note: "",
  };
}

function aziendaOptionsFor(
  aziende: ReferenceData["aziende"],
  items: ReadonlyArray<Attivita>
): ReadonlyArray<Option> {
  const recent: string[] = [];
  for (const a of items) {
    if (!recent.includes(a.aziendaId)) recent.push(a.aziendaId);
    if (recent.length >= RECENT_AZIENDE_LIMIT) break;
  }
  const sorted = [...aziende].sort((a, b) => {
    const ai = recent.indexOf(a.id);
    const bi = recent.indexOf(b.id);
    if (ai === -1 && bi === -1) return a.nome.localeCompare(b.nome, "it");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return [
    { value: "", label: "Scegli azienda" },
    ...sorted.map((a) => ({
      value: a.id,
      label: recent.includes(a.id) ? `★ ${a.nome}` : a.nome,
    })),
  ];
}

function tipoOptionsFor(tipi: ReferenceData["tipi"]): ReadonlyArray<Option> {
  return [
    { value: "", label: "Scegli tipo" },
    ...sortTipiForQuickEntry(tipi).map((t) => ({ value: t.id, label: t.nome })),
  ];
}

interface UseQuickEntryFormStateArgs {
  open: boolean;
  user: ActorContext | null;
  attivita: AttivitaRepository;
  ref: ReferenceData;
}

export function useQuickEntryFormState({
  open,
  user,
  attivita,
  ref,
}: UseQuickEntryFormStateArgs): QuickEntryFormState {
  const createMutation = useCreateAttivita();
  const form = useForm<QuickEntryFormValues>({
    resolver: zodResolver(quickEntryFormSchema),
    defaultValues: defaultValues(),
    mode: "onSubmit",
  });
  const dupSkipRef = useRef(false);
  const prevTipoRef = useRef("");

  const recentQuery = useQuery<Attivita[]>({
    queryKey: queryKeys.attivita(),
    queryFn: () => attivita.list(),
  });
  const items = useMemo(() => recentQuery.data ?? [], [recentQuery.data]);

  const data = useWatch({ control: form.control, name: "data" }) ?? "";
  const aziendaId = useWatch({ control: form.control, name: "aziendaId" }) ?? "";
  const tipoId = useWatch({ control: form.control, name: "tipoId" }) ?? "";
  const tariffa = useWatch({ control: form.control, name: "tariffa" }) ?? "";

  const tariffaNum = parseTariffa(tariffa);
  const candidateDate = useMemo(
    () => parseDateInput(data) ?? new Date(NaN),
    [data]
  );

  const meanByTipo = useMemo(() => meanTariffaByTipo(items), [items]);
  const rangeMean = useMemo(
    () => isTariffaOutOfRange({ tariffa: tariffaNum, tipoId, meanByTipo }),
    [tariffaNum, tipoId, meanByTipo]
  );
  const rangeWarning =
    rangeMean === null
      ? null
      : `Tariffa fuori dal range solito per questo tipo (media ${formatEuro(rangeMean)}).`;

  const duplicateExists = useMemo(
    () =>
      hasDuplicateAttivita({
        items,
        aziendaId,
        tipoId,
        date: candidateDate,
      }),
    [items, aziendaId, tipoId, candidateDate]
  );

  const aziendaOptions = useMemo(
    () => aziendaOptionsFor(ref.aziende, items),
    [ref.aziende, items]
  );
  const tipoOptions = useMemo(() => tipoOptionsFor(ref.tipi), [ref.tipi]);
  const combos = useMemo(() => computeCombos(items), [items]);

  useEffect(() => {
    dupSkipRef.current = false;
  }, [aziendaId, tipoId, data]);

  useEffect(() => {
    if (!open) return;
    if (tipoId === prevTipoRef.current) return;
    prevTipoRef.current = tipoId;
    if (!tipoId) return;
    const tipo = ref.tipi.find((t) => t.id === tipoId);
    const nextModalita = tipo?.modalitaDefault ?? "fissa";
    form.setValue("modalita", nextModalita, { shouldDirty: false });
    if (nextModalita !== "oraria") {
      form.setValue("ore", "", { shouldDirty: false });
    }
    if (nextModalita !== "adElemento") {
      form.setValue("elementi", "", { shouldDirty: false });
    }
    if (form.getValues("tariffa").trim() === "") {
      const fallback = defaultTariffaForTipo(tipoId, ref.tipi);
      if (fallback !== null) {
        form.setValue("tariffa", fallback, { shouldDirty: false });
      }
    }
  }, [tipoId, open, ref.tipi, form]);

  const ginQuery = useLastAttivitaByAziendaAndTipo(
    aziendaId,
    tipoId,
    { enabled: open && tipoId === GINECOLOGIA_TIPO_ID && !!aziendaId }
  );
  useEffect(() => {
    if (!open) return;
    if (tipoId !== GINECOLOGIA_TIPO_ID) return;
    if (!aziendaId) return;
    if (ginQuery.isPending || ginQuery.isFetching) return;
    const last = ginQuery.data;
    if (!last) return;
    if (form.getValues("tariffa").trim() !== "") return;
    form.setValue("tariffa", String(last.tariffa), { shouldDirty: false });
  }, [aziendaId, tipoId, open, ginQuery.data, ginQuery.isPending, ginQuery.isFetching, form]);

  const resetAll = useCallback(
    (over?: Partial<QuickEntryFormValues>): void => {
      form.reset({ ...defaultValues(), ...over });
      dupSkipRef.current = false;
      prevTipoRef.current = "";
    },
    [form]
  );

  useEffect(() => {
    if (!open) resetAll();
  }, [open, resetAll]);

  const submit = useCallback(
    async (
      values: QuickEntryFormValues
    ): Promise<{ ok: false } | { ok: true; id: string }> => {
      if (!user) return { ok: false };
      form.clearErrors("root");
      const parsedDate = parseDateInput(values.data);
      if (!parsedDate) {
        form.setError("data", { message: "Data non valida" });
        return { ok: false };
      }
      const azienda = ref.aziende.find((a) => a.id === values.aziendaId);
      const tipo = ref.tipi.find((t) => t.id === values.tipoId);
      if (!azienda || !tipo) {
        form.setError("root", { message: "Cliente o tipo non valido" });
        return { ok: false };
      }
      if (duplicateExists && !dupSkipRef.current) {
        form.setError("root", {
          message:
            "Esiste già un'attività identica oggi. Premi Salva di nuovo per confermare.",
        });
        dupSkipRef.current = true;
        return { ok: false };
      }
      const note = values.note.trim();
      const oraria = values.modalita === "oraria";
      const adElemento = values.modalita === "adElemento";
      const parsed = attivitaInputSchema.safeParse({
        data: parsedDate,
        aziendaId: values.aziendaId,
        tipoId: values.tipoId,
        oraria,
        adElemento,
        tariffa: Number(values.tariffa),
        ...(oraria ? { ore: Number(values.ore) } : {}),
        ...(adElemento ? { elementi: Number(values.elementi) } : {}),
        ...(note ? { note } : {}),
      });
      if (!parsed.success) {
        form.setError("root", { message: "Dati non validi" });
        return { ok: false };
      }
      const input: AttivitaInput = parsed.data;
      try {
        const created = await createMutation.mutateAsync({
          input,
          denorm: { aziendaNome: azienda.nome, tipoNome: tipo.nome },
          actor: user,
        });
        return { ok: true, id: created.id };
      } catch (err) {
        console.error("quick entry save failed", err);
        form.setError("root", { message: "Salvataggio non riuscito" });
        return { ok: false };
      }
    },
    [user, form, ref.aziende, ref.tipi, duplicateExists, createMutation]
  );

  return {
    form,
    busy: createMutation.isPending || form.formState.isSubmitting,
    tariffaNum,
    duplicateExists,
    rangeWarning,
    aziendaOptions,
    tipoOptions,
    combos,
    rootError: form.formState.errors.root?.message,
    submit,
    resetAll,
  };
}
