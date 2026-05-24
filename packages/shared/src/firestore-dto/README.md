# Firestore DTOs

This folder is the **wire-format boundary for the Firestore adapter**, not a cross-database abstraction.

## Where the real decoupling lives

The architecture has three layers of separation:

1. **Domain (`packages/shared/src/domain/`)** — entities + ports. DB-agnostic. Features import from here.
2. **Port (`packages/shared/src/domain/ports/XxxRepository.ts`)** — interface that any adapter must implement. The contract.
3. **Adapter (`packages/web/src/infrastructure/firestore/FirestoreXxxRepository.ts`)** — concrete implementation of the port using Firestore.

If we ever switch DB to Postgres / SQLite / IndexedDB:

```
packages/web/src/infrastructure/postgres/
└── PostgresContiRepository.ts   implements ContiRepository (the same port)
```

Then a single line changes in `packages/web/src/infrastructure/composition/firestore.ts`:

```diff
-import { FirestoreContiRepository } from "../firestore/FirestoreContiRepository";
+import { PostgresContiRepository } from "../postgres/PostgresContiRepository";
```

Features are untouched. The port is the abstraction.

## What this folder is

A within-adapter parsing helper. `parseConto(id, snap.data())` validates the Firestore document shape via Zod and produces a domain `Conto`. It centralizes:

- Field defaults (`saldato ?? false`)
- Timestamp → Date conversion
- Inline `as` cast removal (one Zod parse vs ~25 unsafe casts per repo)
- Schema-drift detection (Zod fails loudly when a field type changes)

If we add a Postgres adapter, it would have its own `postgres-dto/` folder with its own `parseConto` — they share the same target `Conto` entity but different source shapes.

## Conventions

- One file per aggregate: `firestore-dto/xxx.ts`
- Schema named `xxxDtoSchema` (Zod)
- Type named `XxxDTO` (PascalCase + DTO suffix)
- Parser named `parseXxx(id, raw): Xxx` — throws on invalid input
- The repo's `fromSnap(id, data)` reduces to one line: `return parseXxx(id, data)`

See `conto.ts` for the reference pattern.
