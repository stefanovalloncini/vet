import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useWatch, type UseFormReturn } from "react-hook-form";
import {
  computeTotale,
  type ActivityType,
  type ActorContext,
  type Attivita,
  type Azienda,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";
import { useToast } from "../../../shared/ui";
import { useCreateReminder } from "../../reminders/hooks/useReminders";
import {
  useCreateAttivita,
  useSoftDeleteAttivita,
  useUpdateAttivita,
} from "./useAttivita";
import { useTariffaSuggestion } from "./useTariffaSuggestion";
import { parseDateInput } from "../lib/format";
import {
  attivitaToFormValues,
  formValuesToInput,
  type AttivitaFormValues,
} from "../lib/formSchema";
import { attivitaI18n as t } from "../i18n";

export interface UseExistingAttivitaResult {
  data: Attivita | null | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useExistingAttivita(
  id: string | undefined
): UseExistingAttivitaResult {
  const { attivita: repo } = useRepositories();
  const query = useQuery<Attivita | null>({
    queryKey: queryKeys.attivitaById(id),
    queryFn: () => (id ? repo.getById(id) : Promise.resolve(null)),
    enabled: id !== undefined,
  });
  return {
    data: id === undefined ? null : query.data,
    isLoading: id !== undefined && query.isLoading,
    isError: query.isError,
  };
}

interface HydrationArgs {
  form: UseFormReturn<AttivitaFormValues>;
  existing: UseExistingAttivitaResult;
  isEdit: boolean;
  targetId: string | undefined;
}

export function useAttivitaHydration(args: HydrationArgs): void {
  const { form, existing, isEdit, targetId } = args;
  const navigate = useNavigate();
  const hydratedRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (hydratedRef.current !== targetId) {
      hydratedRef.current = undefined;
    }
    if (existing.data && hydratedRef.current !== targetId) {
      form.reset(attivitaToFormValues(existing.data, isEdit));
      hydratedRef.current = targetId;
    }
    if (targetId && existing.data === null && !existing.isLoading) {
      navigate("/attivita", { replace: true });
    }
  }, [existing.data, existing.isLoading, targetId, isEdit, navigate, form]);
}

interface DerivedArgs {
  form: UseFormReturn<AttivitaFormValues>;
  tipi: ReadonlyArray<ActivityType>;
  isEdit: boolean;
}

export interface AttivitaDerived {
  totaleLive: number | null;
  tariffaSuggested: boolean;
}

export function useAttivitaDerived(args: DerivedArgs): AttivitaDerived {
  const { form, tipi, isEdit } = args;
  const aziendaId = useWatch({ control: form.control, name: "aziendaId" });
  const tipoId = useWatch({ control: form.control, name: "tipoId" });
  const tariffa = useWatch({ control: form.control, name: "tariffa" });
  const ore = useWatch({ control: form.control, name: "ore" });
  const oraria = useWatch({ control: form.control, name: "oraria" });

  const tipiMutable = useMemo(() => [...tipi], [tipi]);

  const { suggested, clear } = useTariffaSuggestion({
    aziendaId,
    tipoId,
    tipi: tipiMutable,
    isEdit,
    currentTariffa: tariffa,
    onSuggest: (value) =>
      form.setValue("tariffa", value, { shouldValidate: false }),
  });

  const clearRef = useRef(clear);
  clearRef.current = clear;

  useEffect(() => {
    const sub = form.watch((_value, info) => {
      if (info.name === "tariffa" && info.type === "change") clearRef.current();
    });
    return () => sub.unsubscribe();
  }, [form]);

  const totaleLive = useMemo(() => {
    const tariffaNum = Number(tariffa);
    const oreNum = Number(ore);
    if (!Number.isFinite(tariffaNum) || tariffaNum <= 0) return null;
    if (oraria && (!Number.isFinite(oreNum) || oreNum <= 0)) return null;
    return computeTotale({
      oraria,
      tariffa: tariffaNum,
      ...(oraria ? { ore: oreNum } : {}),
    });
  }, [tariffa, ore, oraria]);

  return { totaleLive, tariffaSuggested: suggested };
}

interface SubmitArgs {
  form: UseFormReturn<AttivitaFormValues>;
  id: string | undefined;
  isEdit: boolean;
  user: ActorContext | null;
  aziende: ReadonlyArray<Azienda>;
  tipi: ReadonlyArray<ActivityType>;
}

export interface UseAttivitaSubmitResult {
  busy: boolean;
  onSubmit: (values: AttivitaFormValues) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export function useAttivitaSubmit(args: SubmitArgs): UseAttivitaSubmitResult {
  const { form, id, isEdit, user, aziende, tipi } = args;
  const navigate = useNavigate();
  const { notify } = useToast();
  const createMutation = useCreateAttivita();
  const updateMutation = useUpdateAttivita();
  const deleteMutation = useSoftDeleteAttivita();
  const createReminder = useCreateReminder();

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    form.formState.isSubmitting;

  const maybeCreateReminder = useCallback(
    async (values: AttivitaFormValues, azienda: Azienda): Promise<void> => {
      if (!user) return;
      const dueDate = parseDateInput(values.reminderAt);
      const title = values.reminderTitle.trim();
      if (!dueDate || !title) return;
      try {
        await createReminder.mutateAsync({
          input: { aziendaId: azienda.id, titolo: title, dueAt: dueDate },
          denorm: { aziendaNome: azienda.nome },
          actor: user,
        });
        notify("Promemoria creato", "success");
      } catch {
        void 0;
      }
    },
    [user, createReminder, notify]
  );

  const onSubmit = useCallback(
    async (values: AttivitaFormValues): Promise<void> => {
      if (!user) return;
      const azienda = aziende.find((a) => a.id === values.aziendaId);
      const tipo = tipi.find((tp) => tp.id === values.tipoId);
      if (!azienda || !tipo) {
        form.setError("root", { message: t.erroreSalvataggio });
        return;
      }
      const input = formValuesToInput(values);
      const denorm = { aziendaNome: azienda.nome, tipoNome: tipo.nome };
      try {
        if (isEdit && id) {
          await updateMutation.mutateAsync({ id, input, denorm, actor: user });
          notify("Attività aggiornata", "success");
        } else {
          await createMutation.mutateAsync({ input, denorm, actor: user });
          notify("Attività registrata", "success");
          await maybeCreateReminder(values, azienda);
        }
        navigate("/attivita");
      } catch {
        form.setError("root", { message: t.erroreSalvataggio });
        notify(t.erroreSalvataggio, "error");
      }
    },
    [
      user,
      aziende,
      tipi,
      isEdit,
      id,
      updateMutation,
      createMutation,
      notify,
      maybeCreateReminder,
      navigate,
      form,
    ]
  );

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!isEdit || !id || !user) return;
    try {
      await deleteMutation.mutateAsync({ id, actor: user });
      navigate("/attivita");
    } catch {
      form.setError("root", { message: t.erroreSalvataggio });
    }
  }, [isEdit, id, user, deleteMutation, navigate, form]);

  return { busy, onSubmit, handleDelete };
}
