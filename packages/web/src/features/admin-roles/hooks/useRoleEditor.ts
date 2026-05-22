import { useEffect, useState } from "react";
import {
  roleInputSchema,
  type ActorContext,
  type Capability,
  type Role,
  type RoleInput,
  type RoleRepository,
} from "@vet/shared";
import { rolesI18n as t } from "../i18n";

export type RoleEditorOutcome =
  | { kind: "saved" }
  | { kind: "error"; message: string };

export interface UseRoleEditorOptions {
  id?: string;
  repo: RoleRepository;
  user: ActorContext | null;
}

export interface UseRoleEditorResult {
  isEdit: boolean;
  loading: boolean;
  loadError: string | null;
  notFound: boolean;
  draftId: string;
  setDraftId: (next: string) => void;
  name: string;
  setName: (next: string) => void;
  description: string;
  setDescription: (next: string) => void;
  capabilities: ReadonlySet<Capability>;
  setCapabilities: (next: ReadonlySet<Capability>) => void;
  busy: boolean;
  error: string | null;
  canManage: boolean;
  isLocked: boolean;
  readonly: boolean;
  save: () => Promise<RoleEditorOutcome>;
  remove: () => Promise<RoleEditorOutcome>;
}

const ID_PATTERN = /^[a-z][a-z0-9-]{0,40}$/;

export function useRoleEditor(
  options: UseRoleEditorOptions
): UseRoleEditorResult {
  const { id, repo, user } = options;
  const isEdit = id !== undefined && id !== "nuovo";

  const [loaded, setLoaded] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [draftId, setDraftId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capabilities, setCaps] = useState<ReadonlySet<Capability>>(
    () => new Set()
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    void (async () => {
      try {
        const r = await repo.getById(id);
        if (cancelled) return;
        if (!r) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setLoaded(r);
        setDraftId(r.id);
        setName(r.name);
        setDescription(r.description ?? "");
        setCaps(new Set(r.capabilities));
        setLoading(false);
      } catch {
        if (cancelled) return;
        setLoadError(t.loadError);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, repo]);

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
    setBusy(true);
    setError(null);
    try {
      if (isEdit) await repo.update(idForWrite, parsed.data, user.uid);
      else await repo.create(idForWrite, parsed.data, user.uid);
      return { kind: "saved" };
    } catch {
      setError(t.saveError);
      setBusy(false);
      return { kind: "error", message: t.saveError };
    }
  }

  async function remove(): Promise<RoleEditorOutcome> {
    if (!isEdit || !id || readonly) {
      return { kind: "error", message: t.saveError };
    }
    setBusy(true);
    setError(null);
    try {
      await repo.delete(id);
      return { kind: "saved" };
    } catch {
      setError(t.saveError);
      setBusy(false);
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
