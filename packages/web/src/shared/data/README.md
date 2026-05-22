# Data layer (TanStack Query)

Server state lives in TanStack Query. Hooks under `features/*/hooks/` wrap repository
calls in `useQuery` / `useMutation`. The provider is mounted once at the app root
(`main.tsx`).

Why: caching, deduplication, automatic refetch on focus/network, cross-component
shared cache, devtools. See the migration spec at
`~/.claude/plans/Vet/2026-05-22-data-and-forms-migration.md`.

## Conventions

### Hook naming

One hooks file per entity under `features/<feature>/hooks/use<Entity>.ts`. Export
the queries and mutations together.

| Concern        | Name                          |
|----------------|-------------------------------|
| List           | `use<Entity>()`               |
| By id          | `use<Entity>(id)` or `use<Entity>ById(id)` |
| Create         | `useCreate<Entity>()`         |
| Update         | `useUpdate<Entity>()`         |
| Delete         | `useDelete<Entity>()`         |
| Domain-specific| `use<Verb><Entity>()` (e.g. `usePinAzienda`) |

### Query keys

Use the `queryKeys` factory in `queryClient.ts`. Never inline arrays at call sites
unless invalidating a feature prefix (see below).

```ts
// good
useQuery({ queryKey: queryKeys.aziende, queryFn: () => repo.list() });
useQuery({ queryKey: queryKeys.azienda(id), queryFn: () => repo.getById(id) });

// avoid
useQuery({ queryKey: ["aziende"], queryFn: () => repo.list() });
```

For function-keys (filtered queries), invalidation by prefix uses the bare string
array — TanStack Query matches by prefix:

```ts
// invalidate every payments-filtered variant
qc.invalidateQueries({ queryKey: ["payments"] });
```

### Mutation pattern

Default: invalidate-and-refetch on success. Keep the mutation in the same file as
the related queries.

```ts
export function useCreateAzienda() {
  const { aziende: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, actor }: CreateInput) => repo.create(input, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.aziende }),
  });
}
```

Optimistic updates are rare — only when latency hurts UX (quick-entry undo, list
row toggles). See `useUndoCreateAttivita` (when migrated) for the canonical
example. Default to invalidate-and-refetch unless you have a concrete reason.

### Cross-feature invalidation

A mutation may need to invalidate more than one entity. Examples:

- `useCreatePayment` invalidates both `["payments"]` and `["aziende"]` because
  `useAziendaDetail` is keyed under the aziende prefix and its payments slice
  must refresh after a new payment.
- `useRestoreTrashed` invalidates both `["trash"]` and `["attivita"]`.

When this happens, extract a small `invalidate<Scope>(qc)` helper in the same
file to make the scope obvious at the mutation site.

### Composite hooks

Most "composite" reads are a single `useQuery` with a `Promise.all` in the
`queryFn` (see `useAziendaDetail`, `usePaymentsData`, `useAllowlist`). This keeps
loading/error states unified and the cache entry atomic.

If you need to compose two existing top-level hooks (e.g. dashboards), call them
side-by-side and derive flags inline:

```ts
const att = useAttivita(filters);
const pay = usePaymentsData();
const loading = att.isLoading || pay.loading;
```

Don't build a "combineQueries" helper until at least three call sites need the
same composition.

### Form hydration

Forms that need to seed state from a loaded entity should use a one-shot
hydration sentinel rather than syncing on every render. See `useRoleEditor`:

```ts
const [hydratedFor, setHydratedFor] = useState<string | null>(null);
useEffect(() => {
  if (!loaded || hydratedFor === loaded.id) return;
  setDraftId(loaded.id);
  // ...
  setHydratedFor(loaded.id);
}, [loaded, hydratedFor]);
```

After the React Hook Form migration, `reset()` from `useForm` will replace this.

## Adding a new feature

1. Add the entity's keys to `queryKeys` in `queryClient.ts`:

   ```ts
   foos: ["foos"] as const,
   foo: (id: string) => ["foos", id] as const,
   ```

2. Create `features/foos/hooks/useFoos.ts` with the queries and mutations:

   ```ts
   import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
   import { useRepositories } from "../../../infrastructure/RepositoriesContext";
   import { queryKeys } from "../../../shared/data/queryClient";

   export function useFoos() {
     const { foos: repo } = useRepositories();
     return useQuery({ queryKey: queryKeys.foos, queryFn: () => repo.list() });
   }

   export function useCreateFoo() {
     const { foos: repo } = useRepositories();
     const qc = useQueryClient();
     return useMutation({
       mutationFn: (input: FooInput) => repo.create(input),
       onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.foos }),
     });
   }
   ```

3. Consume in the component:

   ```ts
   const { data: foos = [], isLoading, isError } = useFoos();
   const create = useCreateFoo();
   await create.mutateAsync(input);
   ```

4. Add a hook test under `hooks/__tests__/useFoos.test.tsx` using
   `renderHook` + an in-memory repo wrapped in `QueryClientProvider` +
   `RepositoriesProvider`. Cover the query happy path and that each mutation
   refreshes the affected list.

5. Add a Playwright spec under `packages/web/e2e/foos-query.spec.ts` exercising
   read + one mutation against the emulator.

## File map

- `queryClient.ts` — `createQueryClient()`, defaults, `queryKeys` factory.
- `QueryProvider.tsx` — wraps the app with `QueryClientProvider` and devtools
  (dev only).
- `index.ts` — barrel.
