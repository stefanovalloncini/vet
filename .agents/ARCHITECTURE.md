# Architecture

This document describes the target architecture for the `vet` monorepo and the refactor needed to reach it. The reference is the `inxpect-mexview-monorepo` (under `~/Dev/`), adapted to a Firestore backend.

## What this architecture buys you

Three concrete benefits, in priority order:

1. **One read path and one write path per entity.** All Firestore I/O for a given collection lives in a single repository class. New handlers don't reinvent queries; bug fixes happen in one place.
2. **Testability without the emulator.** Handlers, hooks, and scripts depend on port interfaces. The in-memory implementations in `@vet/shared/testing/` let you write fast unit tests without spinning up `firebase emulators:start`.
3. **A single boundary that parses `unknown` into a typed entity.** Today, half the web infrastructure files cast Firestore payloads with `as string`. Replacing those casts with Zod parsers eliminates a whole class of silent shape mismatches.

### What it does **not** buy you

A note on the mexview comparison: in mexview, the architecture genuinely makes the DB swappable because `kysely-codegen` generates types from MySQL and the application layer never touches the driver. In vet, **"swap Firestore for Postgres" is not a contained refactor**, regardless of how clean the ports look. Reasons:

- [firestore.rules](firestore.rules) is the authorization layer. ~430 lines of capability checks, server-stamp enforcement, soft-delete state machines, and cross-document `exists()` checks. None of it survives a backend swap.
- The port shapes already leak the storage model. `ContiRepository.emit(...)` takes a denormalized `aziendaNome` because Firestore can't join. `allowlist/{emailNorm}` uses the document ID as a uniqueness constraint. A Postgres impl would not want either.
- Real-time listeners (`onSnapshot` in `FirebaseAuthService` for session revocation) are Firestore-native. No port can hide that.
- Multi-document atomicity uses `runTransaction` / `writeBatch` inline in handlers (e.g. [`acceptAccessRequest`](packages/functions/src/auth/acceptAccessRequest.ts), [`signInTicket`](packages/functions/src/auth/signInTicket.ts)). The current `Repositories` aggregate has no notion of transactions.

Treat portability as a side effect of clean layering, not the goal.

---

## 0. Constraints

These are binding constraints on every change in this doc. If a proposal violates one, it doesn't ship until justified.

1. **Path A only.** The frontend keeps talking directly to Firestore via the client SDK. The Firestore SDK is hidden inside `infrastructure/`, not removed from the bundle. We do not put reads behind Cloud Functions to "hide" the backend (that would be Path B — see [§5](#5-what-stays-firestore-shaped-intentional) note). Reason: Path B replaces every Firestore read with a Function invocation, which is the single biggest way to blow up Firebase billing.
2. **Zero net change in Firebase costs.** No refactor in this doc is allowed to add a Cloud Function invocation, a Firestore read, a Firestore write, or a real-time listener that wasn't there before. The architecture is a code-organization exercise; the call graph against Firebase stays identical. Reviewers should check this on every PR.
3. **Code cleanliness is the top priority within those two constraints.** When in doubt between "fewer files / less abstraction" and "clearer boundaries", choose the clearer boundaries. The whole point of this refactor is to stop paying for hidden coupling.

---

## 1. The layers

```
┌──────────────────────────────────────────────────────────┐
│  Feature layer (UI / handler logic)                      │
│  - React features (packages/web/src/features)            │
│  - Callable / scheduled handlers (packages/functions)    │
│  - Scripts (scripts/)                                    │
└──────────────────────────────────────────────────────────┘
                          │  imports
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Composition + DI                                        │
│  - useRepositories() in web (exists)                     │
│  - getRepositories() in functions/scripts (NEW)          │
└──────────────────────────────────────────────────────────┘
                          │  injects
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Repository implementations (infrastructure)             │
│  - FirestoreXxxRepository in web/src/infrastructure      │
│  - FirestoreXxxRepository in functions/src/infrastructure│
│  - In-memory in @vet/shared/testing (exists)             │
└──────────────────────────────────────────────────────────┘
                          │  implements
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Domain ports + entities (@vet/shared/domain) (exists)   │
│  - Repository interfaces (UserRepository, ...)           │
│  - Domain types (User, Azienda, Conto, ...)              │
└──────────────────────────────────────────────────────────┘
                          ▲  validates / produces
                          │
┌──────────────────────────────────────────────────────────┐
│  DTOs + schemas (@vet/shared/firestore-dto)              │
│  - Zod schema per stored shape                           │
│  - parseXxx(id, raw) → domain entity                     │
│  - toXxxDocument(entity) → Firestore payload (NEW)       │
└──────────────────────────────────────────────────────────┘
```

Domain ports and DTOs live in `@vet/shared`. Every other package depends on `@vet/shared` and never reaches into another infrastructure package.

---

## 2. Why two type families

Mexview keeps two type families:

- **DB row types** — generated from MySQL by `kysely-codegen` (`packages/dal/src/db/types.ts`). Hand-editing forbidden. The `CamelCasePlugin` makes the row "happen to match" the DTO at runtime.
- **DTOs** — hand-written under `@mex/common`. The API contract and the shape components consume. Mappers like `toUserDto(model)` convert a DB row into a DTO; if the row loses a field, the mapper fails to compile.

The analogue for vet, given Firestore has no enforced schema:

- **DTO** = the Zod schema describing the at-rest document shape. This is the document contract.
- **Domain entity** = the camelCase, parsed, `Date`-typed shape feature code consumes.
- **`parseXxx`** = the only function that consumes `unknown` and produces a typed entity.
- **`toXxxDocument`** = the only function that produces the Firestore payload from an entity. Its input type is derived from the same Zod schema so any schema change forces a callsite update.

[packages/shared/src/firestore-dto/conto.ts](packages/shared/src/firestore-dto/conto.ts) is the existing reference.

### Honest comparison of drift detection

| Concern | mexview (Kysely + codegen) | vet (Zod + parser) |
|---|---|---|
| When does drift surface? | Compile time (`tsc`), everywhere | Runtime, only when a bad doc is read |
| Whole-codebase signal? | Yes — every callsite breaks at once | No — the offending document must actually be fetched |
| Cost of a schema change? | One regen, then fix all TS errors | Coordinated deploy: schema before writers, writers before readers |
| Backward-compat hazard? | Low — old code keeps compiling against old types | High — `.strict()` rejects unknown fields, so adding an optional field crashes readers running the old schema |

This is why the [`parseContoTolerant`](packages/shared/src/firestore-dto/conto.ts) variant exists alongside `parseConto`. During a schema bump, the tolerant parser runs in the transition window. The doc-rule: **add the field to the schema, deploy readers, then deploy writers, then tighten the schema with `.strict()`**. Don't merge a schema-tightening PR and a writer PR in the same release.

---

## 3. The layers in detail

### 3.1 Domain ports + entities — already in place

Every entity has a port in [packages/shared/src/domain/ports/](packages/shared/src/domain/ports/), composed into [`Repositories`](packages/shared/src/domain/ports/Repositories.ts). Example:

```ts
export interface AziendeRepository {
  list(): Promise<Azienda[]>;
  getById(id: string): Promise<Azienda | null>;
  findByNomeNorm(nomeNorm: string): Promise<Azienda | null>;
  create(input: AziendaInput, actor: ActorContext): Promise<string>;
  update(id: string, input: AziendaInput, actor: ActorContext): Promise<void>;
  softDelete(id: string, actor: ActorContext): Promise<void>;
}
```

Rules:

- Methods return **domain entities**, never raw Firestore docs.
- Write methods take a domain input and `ActorContext` for audit trails.
- No Firestore type appears in a port signature — no `DocumentSnapshot`, no `Timestamp`, no `FieldValue`.

Two improvements over the current shape, both small:

- **`create(input, actor): Promise<Entity>`** instead of `Promise<string>`. Returning the entity unlocks optimistic UI without an extra refetch, and avoids a category of `getById(id)` follow-ups in handlers.
- **A transaction port** — see §4.1 below. Several handlers need multi-collection atomicity that the current ports can't express.

### 3.2 DTO + parser + serializer

Pattern (extending the existing `conto.ts`):

```ts
export const aziendaDtoSchema = z.object({
  nome: z.string().min(1).max(200),
  nomeNorm: z.string().min(1).max(200),
  indirizzo: z.string().max(200).optional(),
  // ...
  createdAt: timestampLike,
  updatedAt: timestampLike,
  createdBy: z.string().min(1).max(128),
  updatedBy: z.string().min(1).max(128),
  isDeleted: z.boolean(),
  deletedAt: timestampLike.optional(),
  schemaVersion: z.literal(1),
}).strict();

export type AziendaDTO = z.infer<typeof aziendaDtoSchema>;

export function parseAzienda(id: string, raw: unknown): Azienda { /* ... */ }

// NEW: the mirror write
export function toAziendaDocument(
  entity: AziendaWrite,
  serverNow: ServerTimestamp,
): z.input<typeof aziendaDtoSchema> { /* ... */ }
```

Rules:

- One file per entity in `packages/shared/src/firestore-dto/`.
- `.strict()` on every schema. Combined with the tolerant variant + ordered deploys, this catches console-edits and forgotten fields.
- The parser is the **only** consumer of `unknown` in the codebase.
- The serializer is the **only** producer of Firestore payloads. Its return type derives from the schema (via `z.input<>`), so schema changes break serializers at compile time. This is the closest analogue to mexview's compile-time drift detection.
- The parser throws on the **first** bad document. Repository methods that map over a page need to decide between "fail the whole page" (current behavior) and "log + skip." Make that decision explicit per call site, don't default to either.

### 3.3 Repository implementations

Two infrastructure roots:

- [packages/web/src/infrastructure/firestore/](packages/web/src/infrastructure/firestore/) — exists. 10 implementations covering every port.
- `packages/functions/src/infrastructure/firestore/` — **does not exist**. All 14 handlers call `adminDb.collection(...)` directly.

The existing web layer is split into two camps:

- **Parsed** (the disciplined case): [`FirestoreContiRepository`](packages/web/src/infrastructure/firestore/FirestoreContiRepository.ts) delegates to `parseConto`.
- **Cast** (the legacy case): [`FirestoreAziendeRepository`](packages/web/src/infrastructure/firestore/FirestoreAziendeRepository.ts) and 8 others use `data.nome as string`. Every `as` is a silent runtime risk.

Rules:

- One class per port.
- Constructor takes the Firestore handle. No singletons inside the class.
- Collection name in **one place** per class. Consider a `collections.ts` constant in `@vet/shared` cross-referenced with [firestore.rules](firestore.rules).
- Reads parse through `parseXxx`. Writes go through `toXxxDocument`.
- `serverTimestamp()` and `Timestamp.fromDate()` are infrastructure-only — never visible to features or handlers.

### 3.4 Composition + DI

**Web (existing):** [composition/firestore.ts](packages/web/src/infrastructure/composition/firestore.ts) builds the `Repositories` object once. [`RepositoriesContext`](packages/web/src/infrastructure/RepositoriesContext.tsx) provides it; `useRepositories()` throws if used outside the provider. Don't reinvent this — replicate it.

**Functions (new):** mirror the web composition in `packages/functions/src/infrastructure/composition.ts`:

```ts
let cached: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!cached) {
    cached = {
      clock: new SystemClock(),
      users: new FirestoreUserRepository(adminDb),
      roles: new FirestoreRoleRepository(adminDb),
      // ...
    };
  }
  return cached;
}
```

Same factory serves scripts (`scripts/*`) and handler tests (swap in `createInMemoryRepositories()`).

### 3.5 Feature layer

- **Web:** see [useAziende](packages/web/src/features/aziende/hooks/useAziende.ts). Extract repo from context, wrap in `useQuery` / `useMutation`, invalidate query keys on success. Pattern is correct; extend it.
- **Functions:** handler receives request → calls repository methods → returns response. No `adminDb` or `firebase-admin/firestore` imports in handler files. Pure decision logic (`decideAccessRequestUpdate`, `composeClaims`) stays split out.
- **Scripts:** all data writes via `getRepositories()`. This is what lets a backfill script reuse the same audit and validation rules as the handler.

---

## 4. Cross-cutting concerns

The previous version of this doc skipped these. They're the hard part.

### 4.1 Transactions and batched writes

Used heavily today:

- `runTransaction`: [acceptAccessRequest](packages/functions/src/auth/acceptAccessRequest.ts), [signInTicket](packages/functions/src/auth/signInTicket.ts), [onRoleChange](packages/functions/src/role/onRoleChange.ts), [rejectAccessRequest](packages/functions/src/auth/rejectAccessRequest.ts)
- `writeBatch`: [FirestoreRoleRepository](packages/web/src/infrastructure/firestore/FirestoreRoleRepository.ts) (roles + roleNames mirror), [gdprDeleteMine](packages/functions/src/gdpr/deleteMine.ts) (400-doc paged deletes)

Plain ports cannot express "delete the access request and create the allowlist entry atomically." Two options:

- **Unit-of-work port.** Add `run<T>(work: (tx: Tx) => Promise<T>): Promise<T>` to `Repositories`, where `Tx` exposes the same ports bound to a Firestore transaction. In-memory impl returns a no-op tx. Cost: every implementation grows a tx-aware variant. Benefit: handlers stay transactional and stay free of `adminDb`.
- **Carve-out.** Document that transactional handlers may import `firebase-admin/firestore`. Cost: leakage. Benefit: no new abstraction.

**Recommendation:** ship the UoW port. Without it, the auth handlers can't migrate. Design this **before** writing the second functions repository.

### 4.2 Real-time listeners

[`FirebaseAuthService.subscribeRevocation`](packages/web/src/infrastructure/firebase/FirebaseAuthService.ts) uses `onSnapshot` for session revocation. No general-purpose port can hide this — Postgres has no equivalent without polling or LISTEN/NOTIFY.

Decision: **`AuthService` is an explicit Firestore-coupled exception.** Document it; don't hide it. Any future real-time need (e.g. live reminders) earns the same exception or a polling fallback in the port.

### 4.3 Coordination with `firestore.rules`

[firestore.rules](firestore.rules) and the Zod schemas describe overlapping things:

- Rules: which fields a request may set (`request.resource.data.keys().hasOnly([...])`), server-stamp enforcement, capability gates.
- Schemas: which fields a stored document must have, with what types.

Today they drift independently. Mitigation, in increasing investment order:

1. **Test rules against schema-derived fixtures.** Generate sample documents from each Zod schema, run them through `@firebase/rules-unit-testing` in [packages/rules-tests](packages/rules-tests/), assert allowed/denied. Drift produces test failures.
2. **Generate `hasOnly` lists from the schema.** A small build step that emits a `.rules` partial enumerating the allowed keys per collection. Reduces hand-maintained duplication.

Pick (1) first. (2) is worth it once you have more than ~3 schemas churning.

### 4.4 Audit trail

`audit/` is written after the main write in nearly every handler, outside the transaction. This is intentional — failed audit writes shouldn't roll back the user action — but it's also a footgun:

- An `AuditRepository.record(event)` port consolidates the audit shape and removes 14 copies of the audit object literal.
- It does **not** make audit transactional. Document this as a deliberate "best-effort" semantic, not an oversight.

### 4.5 Pagination

[`gdprDeleteMine`](packages/functions/src/gdpr/deleteMine.ts) already paginates with `limit + repeat`. Today the port shape returns `Promise<Entity[]>` — fine for small collections (`roles`, `activityTypes`), wrong for collections that grow without bound (`attivita`, `audit`).

When porting `attivita` or `audit`, change the relevant port method to return `{ items: Entity[]; cursor: Cursor | null }` and accept an optional `cursor` argument. Easier to retrofit later than it sounds — Firestore cursors are opaque to the caller.

### 4.6 Error mapping

Today handlers throw `HttpsError("not-found", ...)` after inspecting `snap.exists`. After the refactor, a repository must distinguish:

- Document missing → return `null` (existing convention, keep it).
- Rules rejection → throw a typed `PermissionDeniedError` from `@vet/shared`. Handler maps to `HttpsError("permission-denied")`.
- Constraint violation (e.g. duplicate `emailNorm` in allowlist) → throw a typed `ConflictError`.

Add a small `errors.ts` in `@vet/shared/domain/` for these. Without it, handlers either rethrow Firestore errors (leaking the backend) or invent inconsistent error strings.

### 4.7 Schema migrations / backfills

Every document carries `schemaVersion: 1`. The migration story:

- **Adding an optional field:** schema first, deploy readers, then writers. Tighten to `.strict()` already covers unknown fields.
- **Adding a required field:** introduce as `optional` first; backfill via a script that uses `getRepositories()` and writes through `toXxxDocument`; then bump `schemaVersion` and make the field required.
- **Renaming a field:** dual-write through a transition window; backfill old docs; remove the old field from the schema; bump `schemaVersion`.

For richer cases, switch the parser to a `schemaVersion → parser` map and use `parseXxxTolerant` during the transition.

---

## 5. What stays Firestore-shaped (intentional)

Not everything Firestore-flavored is a bug to be hidden. The following are deliberate couplings — document them, don't refactor them away:

- **Document IDs used as uniqueness constraints.** `allowlist/{emailNorm}`, `roleNames/{nameLower}`. These are how Firestore enforces "one row per email" without a UNIQUE index. The application code that builds those keys (`normalizeEmail`, `nameKey`) is load-bearing.
- **Denormalized fields in port inputs.** `ContiRepository.emit(...)` takes `aziendaNome` because Firestore can't join. A future Postgres impl would compute it; the Firestore impl persists what was passed in.
- **Capability strings shared between code and rules.** `decodeCaps` / `encodeCaps` round-trip the same strings that [firestore.rules](firestore.rules) `hasCap("zr")` reads. Treat the capability list in `@vet/shared` as the contract; rules consume it.
- **`schemaVersion` on every document.** Not noise — the lever that makes future migrations tractable.

---

## 6. Refactor: what's in place vs what's missing

| Concern | State |
|---|---|
| Domain ports + entities | ✅ Complete |
| In-memory test doubles | ✅ Complete in `@vet/shared/testing/` |
| Web composition + DI | ✅ [composition/firestore.ts](packages/web/src/infrastructure/composition/firestore.ts), [RepositoriesContext](packages/web/src/infrastructure/RepositoriesContext.tsx) |
| Web feature hooks pattern | ✅ [useAziende](packages/web/src/features/aziende/hooks/useAziende.ts) and siblings |
| DTO + parser/serializer for all entities | ✅ Every entity in [packages/shared/src/firestore-dto/](packages/shared/src/firestore-dto/) follows the `conto.ts` pattern: Zod `xxxDtoSchema` + `parseXxx(id, raw)` + `buildXxx*Doc/Patch` |
| Functions repository layer | ✅ [packages/functions/src/infrastructure/firestore/](packages/functions/src/infrastructure/firestore/) implements every port; [composition.ts](packages/functions/src/infrastructure/composition.ts) provides `getRepositories()` |
| Unit-of-work / tx port | ✅ `Tx` + `Repositories.run((tx) => …)` in [Repositories.ts](packages/shared/src/domain/ports/Repositories.ts); web and functions both provide tx-aware variants |
| Scripts via repositories | ✅ All scripts under [scripts/](scripts/) compose via `getRepositories()` (e.g. seed-roles, seed-activity-types, audit-prime) |
| Error type hierarchy | ✅ [packages/shared/src/domain/errors.ts](packages/shared/src/domain/errors.ts) (`DomainError` + Not-found/Permission/Conflict/StaleState) |
| Rules ↔ schema coordination | 🟡 Rules tests in [packages/rules-tests/](packages/rules-tests/) exercise typical writes; no automatic `hasOnly` generation yet |
| Presentation primitives (DataGrid, Form, PDF, route registry) | ✅ See §11 |
| Capability bundles for product roles | ✅ [packages/shared/src/domain/caps/bundles.ts](packages/shared/src/domain/caps/bundles.ts) |
| Pagamenti read model | ✅ [usePagamentiOverview](packages/web/src/features/pagamenti/hooks/usePagamentiOverview.ts) joins aziende + conti + attivita |

---

## 7. Migration order

Pick one entity at a time. Order chosen by handler-coupling, not "easiest first":

1. **Conto** — no Cloud Function writes `conti` (only backup reads it). Pure web-side win. Lets you validate the `toXxxDocument` pattern before touching functions.
2. **Audit** — port exists; no handler uses it yet. Add `AuditRepository.record(event)`, migrate all 14 handlers to call it instead of writing `audit/` inline. Single-purpose, repetitive — good warm-up.
3. **Build the UoW port (§4.1)** before any auth-entangled entity. Don't try to migrate `acceptAccessRequest` without it.
4. **Allowlist + AccessRequests** — together, because [`acceptAccessRequest`](packages/functions/src/auth/acceptAccessRequest.ts) writes both in a transaction. Validates the UoW design under real load.
5. **Users + Roles** — entangled with auth callbacks (`beforeSignIn`, `signInTicket`, `onRoleChange`). Needs the error type hierarchy from §4.6 to map rules rejections cleanly.
6. **Aziende** — collides with [`monthlyInvoicePush`](packages/functions/src/invoicing/monthlyInvoice.ts) which reads `aziende` AND `attivita` in the same loop and writes `mail`. You'll need a `MailRepository` port that doesn't exist yet. Add it.
7. **Attivita** — last because it's the highest-volume collection. Take the opportunity to switch its port to cursor-paginated reads (§4.5).
8. **Scripts** — migrate after each entity's functions are done, so the same factory serves both.

---

## 8. Before / after examples

Three real comparisons grounded in current files.

### 8.1 A functions handler: `approveUser`

**Current** ([packages/functions/src/auth/approveUser.ts](packages/functions/src/auth/approveUser.ts) — abbreviated):

```ts
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";

export const approveUser = onCall({ ... }, async (request) => {
  // ... permission checks ...

  const [userSnap, roleSnap] = await Promise.all([
    adminDb.collection("users").doc(targetUid).get(),
    adminDb.collection("roles").doc(roleId).get(),
  ]);
  if (!userSnap.exists) throw new HttpsError("not-found", "user");
  if (!roleSnap.exists) throw new HttpsError("not-found", "role");
  const role = roleSnap.data() as { capabilities: Capability[] };  // ← silent cast

  const now = new Date();
  await adminDb.collection("users").doc(targetUid).set(
    buildApprovePatch({ actorUid, roleId, now }),
    { merge: true }
  );

  // ... setCustomUserClaims ...

  await adminDb.collection("audit").add({          // ← inline audit, 14× across handlers
    at: now,
    actorUid,
    actorEmail,
    action: "user.approve",
    targetType: "user",
    targetId: targetUid,
    details: { roleId },
  });
});
```

Problems: three direct `adminDb` calls, one `as` cast on a role document, audit shape duplicated across handlers, no way to unit-test without the emulator.

**Target:**

```ts
import { getRepositories } from "../infrastructure/composition.js";

export const approveUser = onCall({ ... }, async (request) => {
  const repos = getRepositories();
  // ... permission checks ...

  const [user, role] = await Promise.all([
    repos.users.getById(targetUid),
    repos.roles.getById(roleId),
  ]);
  if (!user) throw new HttpsError("not-found", "user");
  if (!role) throw new HttpsError("not-found", "role");

  const now = repos.clock.now();
  const actor: ActorContext = { uid: actorUid, displayName: user.displayName ?? "" };
  await repos.users.approve(targetUid, role.id, actor);

  await repos.auth.setApprovedClaims(targetUid, {
    roleId: role.id,
    caps: role.capabilities,
    displayName: user.displayName,
  });

  await repos.audit.record({
    actor,
    action: "user.approve",
    target: { type: "user", id: targetUid },
    details: { roleId: role.id },
    at: now,
  });
});
```

Wins: zero Firestore imports in this file, role is a typed `Role` not a cast `{ capabilities: Capability[] }`, audit shape lives in one place, the whole handler is unit-testable with `createInMemoryRepositories()`.

### 8.2 A web repository: `FirestoreAziendeRepository`

**Current** ([packages/web/src/infrastructure/firestore/FirestoreAziendeRepository.ts](packages/web/src/infrastructure/firestore/FirestoreAziendeRepository.ts:125-156) — the read path):

```ts
function fromSnap(id: string, data: Record<string, unknown>): Azienda {
  return {
    id,
    nome: data.nome as string,                                    // ← cast
    nomeNorm: data.nomeNorm as string,                            // ← cast
    ...(data.indirizzo ? { indirizzo: data.indirizzo as string } : {}),
    // ... 10 more casts ...
    createdAt: toDate(data.createdAt),
    isDeleted: (data.isDeleted as boolean) ?? false,
    schemaVersion: 1,                                             // ← hardcoded, not read
  };
}
```

And the write path (lines 59–90):

```ts
async create(input: AziendaInput, actor: ActorContext): Promise<string> {
  const ref = doc(collection(this.db, "aziende"));
  await setDoc(ref, {
    nome: input.nome,
    nomeNorm: normalizeAziendaNome(input.nome),
    ...(input.indirizzo !== undefined ? { indirizzo: input.indirizzo } : {}),
    // ... 8 more conditional spreads ...
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actor.uid,
    // ...
    isDeleted: false,
    schemaVersion: 1,
  });
  return ref.id;
}
```

Problems: 15+ `as` casts; the document shape is hand-maintained in two places (read and write) with no link between them; `schemaVersion: 1` is asserted on read without being checked.

**Target** — add `packages/shared/src/firestore-dto/azienda.ts`:

```ts
export const aziendaDtoSchema = z.object({
  nome: z.string().min(1).max(200),
  nomeNorm: z.string().min(1).max(200),
  indirizzo: z.string().max(200).optional(),
  // ... full shape ...
  createdAt: timestampLike,
  updatedAt: timestampLike,
  createdBy: z.string().min(1).max(128),
  isDeleted: z.boolean(),
  schemaVersion: z.literal(1),
}).strict();

export function parseAzienda(id: string, raw: unknown): Azienda { /* same shape as parseConto */ }

export function toAziendaDocument(
  input: AziendaInput,
  actor: ActorContext,
  serverNow: FieldValue,
): z.input<typeof aziendaDtoSchema> {
  return {
    nome: input.nome,
    nomeNorm: normalizeAziendaNome(input.nome),
    ...(input.indirizzo !== undefined ? { indirizzo: input.indirizzo } : {}),
    // ...
    createdAt: serverNow,
    updatedAt: serverNow,
    createdBy: actor.uid,
    isDeleted: false,
    schemaVersion: 1,
  };
}
```

Then the repository shrinks to:

```ts
async list(): Promise<Azienda[]> {
  const snap = await getDocs(query(collection(this.db, "aziende"), where("isDeleted", "==", false)));
  return snap.docs.map((d) => parseAzienda(d.id, d.data()));
}

async create(input: AziendaInput, actor: ActorContext): Promise<Azienda> {
  const ref = doc(collection(this.db, "aziende"));
  const payload = toAziendaDocument(input, actor, serverTimestamp());
  await setDoc(ref, payload);
  return (await this.getById(ref.id))!;          // or build locally from input + ref.id
}
```

Wins: every cast deleted. Read and write share the schema — adding a field means updating one Zod schema and both `parseAzienda` and `toAziendaDocument` fail to compile until they handle it. `create` returns the entity for optimistic UI.

### 8.3 A script: `seed-roles`

**Current** ([scripts/seed-roles.ts](scripts/seed-roles.ts:62-83)):

```ts
await runScript({
  scriptName: "seed-roles",
  run: async () => {
    const db = getFirestore();
    for (const r of SEEDS) {
      const batch = db.batch();
      batch.set(db.collection("roleNames").doc(nameKey(r.name)), { roleId: r.id });
      batch.set(db.collection("roles").doc(r.id), {
        name: r.name,
        capabilities: r.caps,
        locked: r.locked,
        createdAt: FieldValue.serverTimestamp(),
        // ...
        schemaVersion: 1,
      });
      await batch.commit();
    }
  },
});
```

Problems: the role document shape lives here AND in `FirestoreRoleRepository.create` AND in `firestore.rules`. The two-doc mirror (`roles` + `roleNames`) is also reimplemented in the repository.

**Target:**

```ts
await runScript({
  scriptName: "seed-roles",
  run: async () => {
    const repos = getRepositories();
    const seedActor: ActorContext = { uid: "seed", displayName: "Seed Script" };
    for (const r of SEEDS) {
      await repos.roles.upsert(r, seedActor);   // mirror logic lives in the repo
    }
  },
});
```

Wins: the script becomes one line per seed. The `roles + roleNames` mirror lives in `FirestoreRoleRepository.upsert`, where every other writer already finds it. Same script tests cleanly against `createInMemoryRepositories()` to verify seed determinism.

---

## 9. Conventions

- One file per entity in `firestore-dto/`, `domain/ports/`, and each infrastructure root.
- `parseXxx` is the only `unknown`-consumer. `toXxxDocument` is the only Firestore-payload producer.
- No casts (`as`) against Firestore data. Reach for a parser instead.
- No `firebase/firestore` or `firebase-admin/firestore` imports outside `infrastructure/`. Sole documented exception: `FirebaseAuthService` (real-time revocation).
- No collection-name string literals outside the repository that owns the collection.
- In-memory test doubles live in `@vet/shared/testing/` and accept an injectable clock.
- Repositories return domain entities, not DTOs.
- `create` returns the created entity (not just its ID).
- Transactional handler logic uses `repos.run(tx => ...)` (once UoW lands), never `adminDb.runTransaction` directly.
- Schema bumps follow the **schema → readers → writers → tighten** deploy order.

## 10. Anti-patterns

Push back if a PR introduces any of these:

- `adminDb.collection("...").doc(...).get()` inside a handler file.
- `data.someField as string` in any infrastructure file.
- A handler importing both `@vet/shared` ports and `firebase-admin/firestore`.
- Inline `FieldValue.serverTimestamp()` in feature/handler code.
- A field added to a Firestore write but not to the Zod schema.
- A new repository implementation without an in-memory counterpart.
- A new port whose signature differs from those already in `@vet/shared/domain/ports/`.
- A new collection without a corresponding entry in [firestore.rules](firestore.rules) and a rules-test in [packages/rules-tests](packages/rules-tests/).
- A schema-tightening PR that ships in the same release as a writer change.
- Importing `@tanstack/react-table` outside [packages/web/src/shared/ui/data-grid/engine.ts](packages/web/src/shared/ui/data-grid/engine.ts). The engine is the swap point — every consumer goes through `DataGrid`'s public types in `types.ts`.
- A new list/table built with a hand-rolled `<table>` / `<ul>` instead of `DataGrid`. The few exceptions (calendar strip, dosage tool, single-row info cards) must justify why they're not row-shaped data.
- A new feature-page form built with raw `useForm()` + `<FormProvider>` instead of `<Form>` / `<Field>` from [packages/web/src/shared/ui/forms/](packages/web/src/shared/ui/forms/). Per-feature complex forms can still drop down to the RHF wrappers directly, but the default is the Form abstraction.
- A new PDF document built with `window.print()` instead of `@react-pdf/renderer`. The three document templates (`ContoDocument`, `ProformaDocument`, `RiepilogoDocument`) live in [packages/web/src/shared/pdf/](packages/web/src/shared/pdf/) and share the same `AziendaHeader` + `RiepilogoTable` building blocks.
- A new mutation that calls `notify(..., "error")` from its own `onError`. The `MutationCache` registered in [queryClient.ts](packages/web/src/shared/data/queryClient.ts) surfaces error toasts automatically; opt out with `meta: { silent: true }` or customize the message with `meta: { errorMessage: "…" }`.
- A new `<Link to={\`/aziende/${id}\`}>` template-string navigation. Use `routes.aziendaDetail.to({ id })` from the typed registry in [packages/web/src/routes.tsx](packages/web/src/routes.tsx) instead — the `.path` field is the source for `<Route>` declarations.

---

## 11. Presentation primitives

Four foundation modules under `packages/web/src/shared/` and a typed route registry sit between feature code and React / Tailwind / TanStack libraries. They are deliberately small surfaces:

### 11.1 DataGrid — [packages/web/src/shared/ui/data-grid/](packages/web/src/shared/ui/data-grid/)

Generic `DataGrid<T>` wrapping TanStack Table v8. Public API (`Column<T>`, `DataGridProps<T>`, `FilterDef`, `SortState`, `GroupingDef`, `RowAction<T>`) lives in [types.ts](packages/web/src/shared/ui/data-grid/types.ts). The engine is hidden in [engine.ts](packages/web/src/shared/ui/data-grid/engine.ts) — the only file that imports `@tanstack/react-table`.

Three render modes: `table` (default), `cards` (responsive grid; renders a card per row, with group headers when `groupBy` is set), `virtual` (windowed via `react-window`). Same column definitions, same filter contract.

Exports go through the toolbar: CSV via the Italian formatter in [export/csv.ts](packages/web/src/shared/ui/data-grid/export/csv.ts) (UTF-8 BOM, semicolon-delimited, formula-injection guarded); PDF via `jspdf` + `jspdf-autotable`, lazy-imported in [export/pdf.ts](packages/web/src/shared/ui/data-grid/export/pdf.ts).

The grid is **controlled by default** — sort, filters, selection, expansion are owned by the page when the corresponding prop is provided, internal-state when it isn't. Display (`cell`) is JSX, data (`accessor`) is the primitive for sort/filter/export — exporters never invoke `cell`.

### 11.2 Forms — [packages/web/src/shared/ui/forms/](packages/web/src/shared/ui/forms/)

`<Form schema={zodSchema} defaultValues={…} onSubmit={…}>` wraps `useForm` + `<FormProvider>` + `<form>` + scroll-on-error, with a default Italian zod error map. Inside, `<Field name="…" kind="text|number|select|textarea|segmented|switch" …>` delegates to the existing `RHF*` wrappers — those stay as the low-level controllers. `<SubmitButton>` reads `formState.isSubmitting` automatically.

Number fields default to `step={10}` so arrow keys move euro values by 10, not by cents (per client feedback).

### 11.3 PDF documents — [packages/web/src/shared/pdf/](packages/web/src/shared/pdf/)

Three `@react-pdf/renderer` documents: `ContoDocument`, `ProformaDocument` (with a faint diagonal "BOZZA" watermark), and `RiepilogoDocument` for the printable summary. All three compose the same shared `AziendaHeader` + `RiepilogoTable` so the visual language stays consistent.

`renderToBlob` and `downloadPdf` wrap `pdf(doc).toBlob()`. Font registration is idempotent — `ensureFontsRegistered()` is safe to call repeatedly and runs server-side as well, which matters for the future Cloud-Functions-side invoice email render path.

WhatsApp share lives in [share/whatsapp.ts](packages/web/src/shared/pdf/share/whatsapp.ts): builds a `wa.me` URL with a pre-encoded Italian caption (file attachment is OS-level — users attach the just-downloaded PDF themselves).

### 11.4 Typed route registry — [packages/web/src/routes.tsx](packages/web/src/routes.tsx)

A single `routes` object with one entry per route. Each entry exposes `.path` (the `:id`-templated string used by `<Route>` and react-router matching) and `.to(params)` (a typed URL builder that param-encodes values).

```ts
<Route path={routes.aziendaDetail.path} … />     // "/aziende/:id"
navigate(routes.aziendaDetail.to({ id: a.id }))  // "/aziende/abc"
```

`PROTECTED_ROUTES` is now derived from the registry, so adding a route means adding one entry, in one place.

### 11.5 Global mutation error → toast

[`queryClient.ts`](packages/web/src/shared/data/queryClient.ts) installs a `MutationCache` whose `onError` calls a notifier registered by `<ToastProvider>` on mount. Default message: `"Operazione non riuscita. Riprova."` in Italian. Override per-mutation via `meta: { errorMessage: "…" }`; suppress via `meta: { silent: true }`.

Per-callback `notify(err, "error")` lines across feature mutation hooks were removed during the foundation refactor — the global handler covers them. Bespoke messages were moved onto the corresponding `useMutation` `meta.errorMessage`.

### 11.6 Capability bundles

[`packages/shared/src/domain/caps/bundles.ts`](packages/shared/src/domain/caps/bundles.ts) groups capabilities into the three product roles: `VETERINARIO_CAPS`, `VETERINARIO_CAPO_CAPS` (= veterinario + `conti.emit` + `conti.saldo`), `AMMINISTRATORE_CAPS` (= capo + role/allowlist/audit admin). `ROLE_BUNDLES` exports them as named seeds consumed by `scripts/seed-roles.ts` and reusable by any "Create role from bundle" admin affordance.

### 11.7 Pagamenti read model

[`usePagamentiOverview`](packages/web/src/features/pagamenti/hooks/usePagamentiOverview.ts) is the single source of truth for per-azienda payment state: `totaleAperto`, `ultimoContoAt`, `hasUnpaid`, and `needsNewConto` (derived from `cadenzaFatturazione` + last emit + unbilled attivita window via [contoPeriodPolicy.ts](packages/web/src/features/pagamenti/lib/contoPeriodPolicy.ts)). Both the dedicated `/pagamenti` page and the status badge on the Aziende cards consume this hook so the answer never disagrees with itself.
