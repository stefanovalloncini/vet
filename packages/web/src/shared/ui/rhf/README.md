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
import { Button, InlineError } from "../../../shared/ui";
import {
  aziendaFormSchema,
  emptyAziendaForm,
  type AziendaFormValues,
} from "../lib/formSchema";

export function AziendaForm({ onSubmit }: { onSubmit: (v: AziendaFormValues) => Promise<void> }) {
  const form = useForm<AziendaFormValues>({
    resolver: zodResolver(aziendaFormSchema),
    defaultValues: emptyAziendaForm,
    mode: "onSubmit",
  });
  const rootError = form.formState.errors.root?.message;

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <RHFTextField<AziendaFormValues> name="nome" label="Nome" required />
        <RHFTextField<AziendaFormValues> name="indirizzo" label="Indirizzo" />
        {rootError ? <InlineError>{rootError}</InlineError> : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>Salva</Button>
      </form>
    </FormProvider>
  );
}
```

## Mutation integration

The submit handler calls a TanStack Query mutation. Surface server errors via
`form.setError("root", { message })` and render with `<InlineError>`:

```tsx
const createAzienda = useCreateAzienda();
const onSubmit = async (values: AziendaFormValues) => {
  try {
    await createAzienda.mutateAsync({ input: formToAziendaInput(values), actor: user });
    navigate("/aziende");
  } catch {
    form.setError("root", { message: t.erroreSalvataggio });
  }
};
```

## File layout per feature

Each form-driven feature follows the same shape:

```
features/<x>/
  lib/
    formSchema.ts     # form-only Zod schema + types + mappers
  ui/
    <X>FormPage.tsx   # page: useForm, hydration, submit handler
    <X>FormFields.tsx # the fields, reads form via useFormContext
```

`formSchema.ts` exports:

- `<x>FormSchema` — Zod schema for the form (string-shaped: `""` for empty,
  not `undefined`; numbers as strings until submit).
- `<X>FormValues` — `z.infer` of the schema.
- `empty<X>Form` — initial empty values, passed as `defaultValues`.
- `formFrom<X>(server)` — server entity → form values (for edit mode).
- `formTo<X>Input(values)` — form values → repository input (trims, parses
  numbers, drops empty optional fields).

The form schema is intentionally separate from the repository input schema in
`@vet/shared` — the latter rejects `""` and free-text numbers, the former
needs those for empty-input UX.

## Conventions

- Always provide `defaultValues` so RHF knows the form shape. Avoid `undefined`
  fields — use `""` / `0` / `false` as the empty value.
- Use `zodResolver(schema)` with the per-form schema from `lib/formSchema.ts`.
- For dependent / cross-field validation, attach `.superRefine()` to the Zod
  schema rather than handling it imperatively in submit.
- For initial values from server (edit mode), see "Form hydration" below.
- For nested objects, type the path explicitly: `<RHFTextField<MyForm> name="address.street" />`.
- Don't drop down to bare `<TextField>` inside an RHF form — that breaks the
  unified state. Add a wrapper here if you need a new control type.
- Render root errors with `<InlineError>` from `shared/ui`.

## Form hydration in edit flows

When a form edits an existing entity, the initial values come from a `useQuery`.
Wait for the query to load, then `form.reset(formFromX(data))` exactly once.
The sentinel prevents a background refetch from clobbering in-flight edits.

```tsx
const { data, isSuccess } = useAzienda(id);
const form = useForm<AziendaFormValues>({
  resolver: zodResolver(aziendaFormSchema),
  defaultValues: emptyAziendaForm,
});
const hydratedRef = useRef(false);
useEffect(() => {
  if (!isEdit || hydratedRef.current) return;
  if (isSuccess && data === null) {
    navigate("/aziende", { replace: true });
    return;
  }
  if (!data) return;
  form.reset(formFromAzienda(data));
  hydratedRef.current = true;
}, [isEdit, isSuccess, data, form, navigate]);
```

This boilerplate is small (≤10 lines) and the variations across forms differ
enough — bool vs string sentinel, with/without "not found" redirect, mapper
shape — that a `useFormHydration()` hook does not pay off. Keep it inline.

Three legitimate hydration shapes exist:

1. **Once-after-load** (most pages): `useRef(false)` sentinel — see above.
2. **Per-row** (`ActivityTypeForm` used inside a list row): keep the previous
   initial value in `useRef`, reset when it changes.
3. **On-open** (dialog forms): `useEffect(() => { if (open) form.reset(...) }, [open])`.

## Composite / array fields

When the field cannot be rendered as a single primitive — e.g. a checkbox
matrix, a chip editor — drop to `<Controller>` and pass `field.value` /
`field.onChange` to the custom component. Example: `CapabilityMatrix` in
`features/admin-roles/`.

```tsx
<Controller<RoleFormValues, "capabilities">
  control={form.control}
  name="capabilities"
  render={({ field }) => (
    <CapabilityMatrix value={field.value} onChange={field.onChange} />
  )}
/>
```

Use `<RHFTextField>` / `<RHFSelect>` / `<RHFTextArea>` when the field is a
single `<input>` / `<select>` / `<textarea>`. Use `<Controller>` for anything
custom. Don't invent a new RHF wrapper unless 2+ features need it.

## Dialog reset on open/close

Dialog forms reset their values when the dialog opens:

```tsx
useEffect(() => { if (open) form.reset(defaultValues); }, [open, form]);
```

For dialogs that should reset only on the open→open transition (avoiding a
re-reset while already open), use a `wasOpenRef` sentinel — see
`QuickAddTipoDialog`.

## What NOT to do

- Don't pass `value` + `onChange` manually to the RHF wrappers — `useController`
  handles that. The wrapper's job is to subscribe to RHF state.
- Don't manage form state with `useState` in components that also use RHF. Pick
  one. Inside an RHF form, all field state lives in `useForm`.
- Don't render root errors with a hand-rolled `<p role="alert">` — use
  `<InlineError>`.

## Testing

For unit tests that mount a form, use `buildProvidersWrapper` from
`__tests__/renderWithProviders` to wire `QueryClientProvider` +
`RepositoriesProvider` (+ optional `ToastProvider` / `MemoryRouter`). Avoid
re-wiring those providers per test.
