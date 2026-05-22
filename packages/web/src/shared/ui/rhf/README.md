# `shared/ui/rhf/` — React Hook Form wrappers

Thin wrappers around `TextField` / `TextArea` / `Select` that integrate with
[`react-hook-form`](https://react-hook-form.com/). Use these when a control
lives inside a form managed by `useForm()`; use the bare primitives elsewhere.

## Why

`useForm` from RHF + `zodResolver` give us: schema-driven validation, dirty
tracking, focused-error UX, and a single `handleSubmit` entry point — all
without re-deriving form state in every page. The wrappers below subscribe
each field to RHF via `useController` and pipe errors back to the primitive.

The primitive `TextField` / `TextArea` / `Select` are `forwardRef`-enabled so
RHF can focus the first invalid field on submit.

## Usage

```tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFTextField, RHFSelect } from "../../../shared/ui/rhf";
import { Button } from "../../../shared/ui";
import { aziendaCreateSchema, type AziendaCreate } from "@vet/shared";

export function AziendaForm({ onSubmit }: { onSubmit: (v: AziendaCreate) => Promise<void> }) {
  const form = useForm<AziendaCreate>({
    resolver: zodResolver(aziendaCreateSchema),
    defaultValues: { nome: "", indirizzo: "" },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <RHFTextField<AziendaCreate> name="nome" label="Nome" required />
        <RHFTextField<AziendaCreate> name="indirizzo" label="Indirizzo" />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Salva
        </Button>
      </form>
    </FormProvider>
  );
}
```

## Mutation integration

The submit handler typically calls a TanStack Query mutation. Surface server
errors via `form.setError`:

```tsx
const createAzienda = useCreateAzienda();
const onSubmit = async (values: AziendaCreate) => {
  try {
    await createAzienda.mutateAsync(values);
    form.reset();
  } catch (err) {
    form.setError("root", { message: err instanceof Error ? err.message : "Errore" });
  }
};
```

Display root errors with `form.formState.errors.root?.message`.

## Conventions

- Always provide `defaultValues` so RHF knows the form shape. Avoid `undefined`
  fields — use `""` / `0` / `false` as the empty value.
- Use `zodResolver(schema)` with a schema from `@vet/shared`. No custom resolvers.
- For dependent / cross-field validation, attach a refinement to the Zod schema
  rather than handling it imperatively in submit.
- For initial values from server (edit mode), call `form.reset(serverValues)`
  inside an effect that runs once after the server data loads. Use a sentinel
  like `useEffect(() => { if (data && !hydratedRef.current) { form.reset(data); hydratedRef.current = true; } }, [data])`.
- For nested objects, type the path explicitly: `<RHFTextField<MyForm> name="address.street" />`.
- Don't drop down to bare `<TextField>` inside an RHF form — that breaks the
  unified state. Add a wrapper here if you need a new control type.

## Form hydration in edit flows

When a form edits an existing entity, the initial values come from a `useQuery`.
Wait for the query to load, then `form.reset(data)` exactly once:

```tsx
const { data, isLoading } = useAzienda(id);
const form = useForm<AziendaInput>({ defaultValues: emptyAzienda });
const hydratedRef = useRef(false);
useEffect(() => {
  if (data && !hydratedRef.current) {
    form.reset(serverToForm(data));
    hydratedRef.current = true;
  }
}, [data, form]);
```

The sentinel prevents the user's in-flight edits from being clobbered by a
background refetch.

## What NOT to do

- Don't pass `value` + `onChange` manually to the RHF wrappers — `useController`
  handles that. The wrapper's job is to subscribe to RHF state.
- Don't use a `<Controller>` JSX wrapper around bare primitives; use the
  pre-baked `RHF*` wrappers for type safety and consistency.
- Don't manage form state with `useState` in components that also use RHF. Pick
  one. Inside an RHF form, all field state lives in `useForm`.

## Migration from hand-rolled forms

Old shape:
```tsx
const [name, setName] = useState("");
const [error, setError] = useState<string | null>(null);
async function submit(e: FormEvent) {
  e.preventDefault();
  if (!name) { setError("Required"); return; }
  await repo.create({ name });
}
return (
  <form onSubmit={submit}>
    <TextField id="name" value={name} onChange={(e) => setName(e.target.value)} error={error ?? undefined} />
  </form>
);
```

New shape:
```tsx
const form = useForm<{ name: string }>({
  resolver: zodResolver(schema),
  defaultValues: { name: "" },
});
const create = useCreateThing();
return (
  <FormProvider {...form}>
    <form onSubmit={form.handleSubmit((v) => create.mutateAsync(v))}>
      <RHFTextField<{ name: string }> name="name" label="Name" />
    </form>
  </FormProvider>
);
```

Validation and error display come for free from the schema + wrappers.
