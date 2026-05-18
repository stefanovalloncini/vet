import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AppShell,
  Button,
  Card,
  TextField,
  TextArea,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { CAP_GROUPS, rolesI18n as t } from "../i18n";
import {
  CAPABILITIES,
  CAPABILITY_LABELS,
  roleInputSchema,
  type Capability,
  type Role,
  type RoleInput,
} from "@vet/shared";

interface FormState {
  id: string;
  name: string;
  description: string;
  capabilities: Set<Capability>;
}

function emptyForm(): FormState {
  return {
    id: "",
    name: "",
    description: "",
    capabilities: new Set(),
  };
}

export function RoleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined && id !== "nuovo";
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { roles: repo } = useRepositories();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loaded, setLoaded] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    void (async () => {
      const r = await repo.getById(id);
      if (cancelled) return;
      if (!r) {
        navigate("/admin/ruoli", { replace: true });
        return;
      }
      setLoaded(r);
      setForm({
        id: r.id,
        name: r.name,
        description: r.description ?? "",
        capabilities: new Set(r.capabilities),
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate, repo]);

  const canManage = user?.caps.has("roles.manage") ?? false;
  const isLocked = loaded?.locked ?? false;
  const readonly = !canManage || isLocked;

  function toggleCap(cap: Capability) {
    if (readonly) return;
    setForm((s) => {
      const next = new Set(s.capabilities);
      if (next.has(cap)) next.delete(cap);
      else next.add(cap);
      return { ...s, capabilities: next };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readonly || !user) return;
    const input: RoleInput = {
      name: form.name,
      capabilities: [...form.capabilities],
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
    };
    const parsed = roleInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t.saveError);
      return;
    }
    const idForWrite = isEdit ? id! : form.id.trim();
    if (!isEdit && !/^[a-z][a-z0-9-]{0,40}$/.test(idForWrite)) {
      setError(t.campoIdHint);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (isEdit) {
        await repo.update(idForWrite, parsed.data, user.uid);
      } else {
        await repo.create(idForWrite, parsed.data, user.uid);
      }
      navigate("/admin/ruoli");
    } catch {
      setError(t.saveError);
      setBusy(false);
    }
  }

  const groupedCaps = useMemo(
    () =>
      CAP_GROUPS.map((g) => ({
        label: t[g.label] as string,
        items: CAPABILITIES.filter((c) => c.startsWith(g.prefix)),
      })).filter((g) => g.items.length > 0),
    []
  );

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-8">
        <button
          type="button"
          onClick={() => navigate("/admin/ruoli")}
          className="text-sm text-(--color-text-muted) hover:text-(--color-text) mb-3"
        >
          ← {t.back}
        </button>
        <h1 className="text-3xl text-(--color-text)">
          {isEdit ? t.titoloModifica : t.titoloNuovo}
        </h1>
        {isLocked ? (
          <p className="text-xs text-(--color-text-subtle) mt-2">{t.blocked}</p>
        ) : null}
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Card>
          <div className="space-y-5">
            {!isEdit ? (
              <TextField
                id="role-id"
                label={t.campoId}
                value={form.id}
                onChange={(e) =>
                  setForm((s) => ({ ...s, id: e.target.value }))
                }
                hint={t.campoIdHint}
                required
                disabled={busy}
              />
            ) : null}
            <TextField
              id="role-name"
              label={t.campoNome}
              value={form.name}
              onChange={(e) =>
                setForm((s) => ({ ...s, name: e.target.value }))
              }
              required
              disabled={busy || readonly}
              maxLength={60}
            />
            <TextArea
              id="role-description"
              label={t.campoDescrizione}
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
              disabled={busy || readonly}
              maxLength={300}
            />
          </div>
        </Card>

        <section>
          <h2 className="text-xs uppercase tracking-wider font-medium text-(--color-text-muted) mb-3">
            {t.sezioneCap}
          </h2>
          <div className="space-y-4">
            {groupedCaps.map((group) => (
              <Card key={group.label}>
                <h3 className="text-sm font-medium text-(--color-text) mb-3">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.items.map((cap) => (
                    <label
                      key={cap}
                      className={[
                        "flex items-center gap-3 py-1.5 rounded-md",
                        readonly ? "" : "cursor-pointer hover:bg-(--color-surface-muted) px-2 -mx-2",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={form.capabilities.has(cap)}
                        onChange={() => toggleCap(cap)}
                        disabled={readonly}
                        className="w-4 h-4 accent-(--color-accent)"
                      />
                      <span className="text-sm text-(--color-text)">
                        {CAPABILITY_LABELS[cap]}
                      </span>
                      <span className="text-[10px] text-(--color-text-subtle) font-mono ml-auto">
                        {cap}
                      </span>
                    </label>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {error ? (
          <p role="alert" className="text-sm text-(--color-danger)">
            {error}
          </p>
        ) : null}

        {readonly ? null : (
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/admin/ruoli")}
              disabled={busy}
            >
              {t.annulla}
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {t.salva}
            </Button>
          </div>
        )}
      </form>
    </AppShell>
  );
}
