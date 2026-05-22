import { useEffect, useState } from "react";
import {
  roleInputSchema,
  type ActorContext,
  type Capability,
  type RoleInput,
} from "@vet/shared";
import { rolesI18n as t } from "../i18n";
import {
  useCreateRole,
  useDeleteRole,
  useRole,
  useUpdateRole,
} from "./useRoles";

export type RoleEditorOutcome =
  | { kind: "saved" }
  | { kind: "error"; message: string };

export interface UseRoleEditorOptions {
  id?: string;
  user: ActorContext | null;
}

const ID_PATTERN = /^[a-z][a-z0-9-]{0,40}$/;

export function useRoleEditor(options: UseRoleEditorOptions) {
  const { id, user } = options;
  const isEdit = id !== undefined && id !== "nuovo";

  const roleQuery = useRole(isEdit ? id : undefined);
  const loaded = roleQuery.data ?? null;
  const loading = isEdit && roleQuery.isLoading;
  const loadError = roleQuery.isError ? t.loadError : null;
  const notFound = isEdit && roleQuery.isSuccess && loaded === null;

  const createMut = useCreateRole();
  const updateMut = useUpdateRole();
  const deleteMut = useDeleteRole();
  const busy =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const [draftId, setDraftId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capabilities, setCaps] = useState<ReadonlySet<Capability>>(
    () => new Set()
  );
  const [error, setError] = useState<string | null>(null);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded || hydratedFor === loaded.id) return;
    setDraftId(loaded.id);
    setName(loaded.name);
    setDescription(loaded.description ?? "");
    setCaps(new Set(loaded.capabilities));
    setHydratedFor(loaded.id);
  }, [loaded, hydratedFor]);

  const canManage = user?.caps.has("roles.manage") ?? false;
  const isLocked = loaded?.locked ?? false;
  const readonly = !canManage || isLocked;

  function setCapabilities(next: ReadonlySet<Capability>) {
    if (readonly) return;
    setCaps(next);
  }

  async function save(): Promise<RoleEditorOutcome> {
    if (readonly || !user) return { kind: "error", message: t.saveError };
    const input: RoleInput = {
      name,
      capabilities: [...capabilities],
      ...(description.trim() ? { description: description.trim() } : {}),
    };
    const parsed = roleInputSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? t.saveError;
      setError(msg);
      return { kind: "error", message: msg };
    }
    const idForWrite = isEdit ? id! : draftId.trim();
    if (!isEdit && !ID_PATTERN.test(idForWrite)) {
      setError(t.campoIdHint);
      return { kind: "error", message: t.campoIdHint };
    }
    setError(null);
    try {
      const mut = isEdit ? updateMut : createMut;
      await mut.mutateAsync({ id: idForWrite, input: parsed.data, actor: user.uid });
      return { kind: "saved" };
    } catch {
      setError(t.saveError);
      return { kind: "error", message: t.saveError };
    }
  }

  async function remove(): Promise<RoleEditorOutcome> {
    if (!isEdit || !id || readonly) {
      return { kind: "error", message: t.saveError };
    }
    setError(null);
    try {
      await deleteMut.mutateAsync({ id });
      return { kind: "saved" };
    } catch {
      setError(t.saveError);
      return { kind: "error", message: t.saveError };
    }
  }

  return {
    isEdit,
    loading,
    loadError,
    notFound,
    draftId,
    setDraftId,
    name,
    setName,
    description,
    setDescription,
    capabilities,
    setCapabilities,
    busy,
    error,
    canManage,
    isLocked,
    readonly,
    save,
    remove,
  };
}
