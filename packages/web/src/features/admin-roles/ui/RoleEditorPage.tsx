import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  capabilitySchema,
  type Capability,
  type RoleInput,
} from "@vet/shared";
import {
  AppShell,
  Button,
  Card,
  InlineError,
  LoadingHint,
  PageHeader,
  SectionLabel,
} from "../../../shared/ui";
import { RHFTextArea, RHFTextField } from "../../../shared/ui/rhf";
import { useAuthState } from "../../auth";
import { useCreateRole, useRole, useUpdateRole } from "../hooks/useRoles";
import { CapabilityMatrix } from "./CapabilityMatrix";
import { rolesI18n as t } from "../i18n";

const ID_PATTERN = /^[a-z][a-z0-9-]{0,40}$/;

interface RoleFormValues {
  id: string;
  name: string;
  description: string;
  capabilities: Capability[];
}

const EMPTY_VALUES: RoleFormValues = {
  id: "",
  name: "",
  description: "",
  capabilities: [],
};

function buildFormSchema(isEdit: boolean) {
  return z.object({
    id: isEdit
      ? z.string()
      : z.string().regex(ID_PATTERN, t.campoIdHint),
    name: z.string().min(1, t.nomeObbligatorio).max(60),
    description: z.string().max(300),
    capabilities: z.array(capabilitySchema),
  });
}

function toRoleInput(values: RoleFormValues): RoleInput {
  const description = values.description.trim();
  return {
    name: values.name,
    capabilities: [...values.capabilities],
    ...(description ? { description } : {}),
  };
}

export function RoleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthState();

  const isEdit = id !== undefined && id !== "nuovo";

  const roleQuery = useRole(isEdit ? id : undefined);
  const loaded = roleQuery.data ?? null;
  const loading = isEdit && roleQuery.isLoading;
  const loadError = roleQuery.isError ? t.loadError : null;
  const notFound = isEdit && roleQuery.isSuccess && loaded === null;

  const createMut = useCreateRole();
  const updateMut = useUpdateRole();

  const canManage = user?.caps.has("roles.manage") ?? false;
  const isLocked = loaded?.locked ?? false;
  const readonly = !canManage || isLocked;

  const schema = useMemo(() => buildFormSchema(isEdit), [isEdit]);
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
    mode: "onSubmit",
  });

  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!loaded || hydratedFor.current === loaded.id) return;
    form.reset({
      id: loaded.id,
      name: loaded.name,
      description: loaded.description ?? "",
      capabilities: [...loaded.capabilities],
    });
    hydratedFor.current = loaded.id;
  }, [loaded, form]);

  useEffect(() => {
    if (notFound) navigate("/admin/ruoli", { replace: true });
  }, [notFound, navigate]);

  const busy =
    createMut.isPending || updateMut.isPending || form.formState.isSubmitting;

  async function onSubmit(values: RoleFormValues): Promise<void> {
    if (readonly || !user) {
      form.setError("root", { message: t.saveError });
      return;
    }
    const idForWrite = isEdit ? id! : values.id.trim();
    const input = toRoleInput(values);
    try {
      const mut = isEdit ? updateMut : createMut;
      await mut.mutateAsync({ id: idForWrite, input, actor: user.uid });
      navigate("/admin/ruoli");
    } catch {
      form.setError("root", { message: t.saveError });
    }
  }

  if (loading) {
    return (
      <AppShell>
        <LoadingHint label={t.loading} />
      </AppShell>
    );
  }

  const rootError = form.formState.errors.root?.message;

  return (
    <AppShell>
      <PageHeader
        title={isEdit ? t.titoloModifica : t.titoloNuovo}
        back={{ to: "/admin/ruoli", label: t.back }}
        {...(isLocked ? { subtitle: t.blocked } : {})}
      />

      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 max-w-3xl"
        >
          <Card>
            <div className="space-y-5">
              {!isEdit ? (
                <RHFTextField<RoleFormValues>
                  name="id"
                  label={t.campoId}
                  hint={t.campoIdHint}
                  required
                  disabled={busy}
                />
              ) : null}
              <RHFTextField<RoleFormValues>
                name="name"
                label={t.campoNome}
                required
                disabled={busy || readonly}
                maxLength={60}
              />
              <RHFTextArea<RoleFormValues>
                name="description"
                label={t.campoDescrizione}
                disabled={busy || readonly}
                maxLength={300}
              />
            </div>
          </Card>

          <section>
            <SectionLabel as="h2" className="font-medium mb-3">
              {t.sezioneCap}
            </SectionLabel>
            <Controller<RoleFormValues, "capabilities">
              control={form.control}
              name="capabilities"
              render={({ field }) => (
                <CapabilityMatrix
                  value={field.value}
                  onChange={field.onChange}
                  readonly={readonly}
                />
              )}
            />
          </section>

          {loadError ? <InlineError>{loadError}</InlineError> : null}
          {rootError ? <InlineError>{rootError}</InlineError> : null}

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
      </FormProvider>
    </AppShell>
  );
}
