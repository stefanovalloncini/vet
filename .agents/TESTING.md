# Testing

Manual + automated checks. Italian-friendly. Mobile-first.
The golden path matches Alessandro's real-world flow: barn → one-handed iPhone → log a visit while removing gloves.

## 1. Suites

| Suite | Command | What it covers |
|---|---|---|
| Unit | `pnpm -F @vet/web test` | Components, hooks, schemas, formatters. Vitest + jsdom. |
| Shared | `pnpm -F @vet/shared test` | DTOs, serializers, in-memory repos. |
| Functions | `pnpm -F @vet/functions test` | Cloud Functions logic with in-memory repos. |
| Rules | `pnpm test:rules` | Firestore rules with `@firebase/rules-unit-testing`. |
| Lint | `pnpm lint` | ESLint across all packages. |
| Typecheck | `pnpm typecheck` | Strict TS across all packages. |
| E2E | `pnpm test:e2e` | Playwright against the emulator suite. |

Run the green-baseline before every PR: `pnpm typecheck && pnpm lint && pnpm test`.

## 2. Local environment

```bash
pnpm install
pnpm dev    # boots Firebase emulators + Vite on :5173
```

Emulator UI: <http://127.0.0.1:4000>. Vite: <http://localhost:5173>.

Seed users + sample data for manual testing:

```bash
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
GCLOUD_PROJECT=vet-dev \
pnpm -F vet-scripts exec tsx audit-prime.ts
```

`audit-prime.ts` creates `audit.admin@example.com / Audit-Admin-1!` with admin caps and the standard seeds.
Sign in via the auth emulator widget (Google) OR via the magic-link flow (the emulator captures the link in its UI).

Activity-type seeds:

```bash
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
GCLOUD_PROJECT=vet-dev \
pnpm seed:activity-types
```

## 3. Device matrix for manual passes

Test against these viewports — they're the ones that catch real layout issues.

| Device | Viewport | Why |
|---|---|---|
| iPhone SE 3rd gen | 375 × 667 | Smallest mainstream screen — text wraps, segmented controls strain, FABs overlap. |
| iPhone 14 / 15 | 393 × 852 | The actual phone the primary users carry. |
| iPad mini portrait | 768 × 1024 | First width where the desktop sidebar kicks in. |
| Desktop 1280 × 800 | — | Default laptop session. |

For headless verification use Playwright `browser_resize`:

```js
await page.setViewportSize({ width: 375, height: 667 });
```

## 4. Manual golden path

Every PR that touches UI must walk this path on **iPhone SE viewport**.
Each step lists the expected result; deviations are bugs.

### 4.1 First launch (unauthenticated)

1. Open `/` → redirected to `/login`.
2. Top bar shows the V brand + wordmark. Skip link `Vai al contenuto` only appears on Tab focus.
3. Login form: email field, "Invia magic link" button, "oppure" divider, "Entra con Google".
4. Footer: privacy link + build version. Theme toggle works (Tema scuro / Tema chiaro).
5. Tap "Richiedi accesso" → switches to the access-request form, the back link returns you.
6. Submit a malformed email → field error appears inline. Submit an unallowed email → red banner shows the classified error. Multi-sentence errors should still feel like ONE message, not two stacked rows.

### 4.2 Sign in + first paint

1. Sign in as `audit.admin@example.com` (or your seeded user).
2. On first paint the onboarding modal `Pronto a iniziare` opens. No backup-reminder toast appears at the same time.
3. The onboarding step 1 has no decorative sparkle icon. Step 2 shows the `+` icon next to "Aggiungi la tua prima attività" because that's contextually informative.
4. Dismiss with `Salta` → modal closes.
5. The FAB at bottom-right plays a brief teal-ring pulse (twice, ~3.6s total) when no activities exist. Pulse respects `prefers-reduced-motion`.

### 4.3 Inline onboarding hint (dashboard)

1. With no aziende and no attività, the dashboard shows a 1–2 line hint "Per iniziare, crea un'azienda, poi registra un'attività" with a `Nascondi` link.
2. `Nascondi` is anchored to the top-right corner; the paragraph wraps cleanly to its left, not around it.
3. Tap `Nascondi` → hint hides for the session (localStorage `vet.onboardingDismissed`).

### 4.4 Voce rapida (FAB)

1. Tap the `+` FAB → `Voce rapida` modal opens.
2. All fields visible at viewport start: Data, Azienda, Tipo, Modalità tariffa, Tariffa (EUR), Note.
3. `MODALITÀ TARIFFA` segmented control: `Oraria`, `Ad elemento`, `Fissa` each fit on ONE line — no wrap on iPhone SE.
4. `TARIFFA (EUR)` accepts `step=0.01` — typing 49,50 or 1 should not trigger a step warning. Stepper arrows still bump by `0.01`; this is fine for manual entry. The min is 0.
5. Scroll down inside the modal — the Salva / Annulla / Salva e nuova action bar stays sticky at the bottom of the dialog (1px top border, surface background). The user never has to scroll past the form to reach Salva.
6. Tap `+ Nuova` next to Azienda → `Nuova azienda` dialog opens on top. Stacking is allowed but uncomfortable; close it and try entering an azienda inline instead if possible.
7. Submit with all fields blank → each invalid field shows a single-line red error below it. The form does NOT add an extra root banner repeating the same message.

### 4.5 Add azienda

1. From `Voce rapida`, open `+ Nuova` azienda → modal.
2. Type "Allevamento Test" → `Crea` enables once the input has a non-empty trimmed value.
3. `Crea` → modal closes, the parent `Voce rapida` now has Allevamento Test selected in Azienda.
4. Reopen Voce rapida → the new azienda is in the suggestions chips at the top.

### 4.6 Add tipo attività (Alessandro's bug)

1. From `Voce rapida`, open `+ Nuovo` tipo → `Nuovo tipo di attività` dialog.
2. Type `Cesareo` in Nome.
3. Type `100` (or any euro value, including non-multiples of 10) in Tariffa standard.
4. The browser does NOT show a step-mismatch warning. `Crea` succeeds.
5. The form should reject `> 100000` and negative values; positive values up to 5 decimals are accepted.

### 4.7 Save an activity

1. Fill Voce rapida: Data oggi, Azienda Allevamento Test, Tipo Visita clinica, Modalità Fissa, Tariffa 70.
2. `Totale` row appears with `70,00 €` in tabular-num typography.
3. Tap Salva → toast "Attività salvata" (or equivalent) appears ABOVE the FAB (not overlapping it).
4. Riepilogo shows the new activity in monthly stats.

### 4.8 Empty Attività list

1. Navigate to `/attivita` with no records.
2. Layout: PageHeader, filter button, stats row (zeros), grouping selector + export icon, then empty text "Nessuna attività registrata. Tocca il + in basso a destra per la prima."
3. There is NO inline "Aggiungi la prima attività" primary button. The FAB is the only add-action.
4. The FAB plays its attentive pulse if no activities exist.

### 4.9 Empty Aziende list

1. Navigate to `/aziende`.
2. Layout: title, primary `Nuova azienda` header button, search input, then empty state "Nessuna azienda. Usa Nuova azienda in alto per la prima."
3. NO inline "Nuova azienda" link in the empty state — only the header button + (out-of-scope) sidebar route.

### 4.10 Loading transitions

1. Navigate between pages with browser throttling at "Fast 3G".
2. The `Caricamento…` spinner is the lazy-route fallback and currently replaces the chrome — known issue (#16 in audit). The top bar and bottom nav reappear once the chunk loads.
3. Verify the chrome reappears within ~1s on Fast 3G; longer than that, file an issue.

### 4.11 Unknown route → 404

1. Visit `/admin/listino` (does not exist) or `/foo/bar`.
2. The 404 page renders inside AppShell (top + bottom nav present) with title "Pagina non trovata", description, and a `Torna al riepilogo` button.
3. Unauthenticated, the 404 falls back to a centered layout with `Torna al login`.

### 4.12 Impostazioni

1. `/impostazioni`: Account / Tema / Cestino / Backup / Privacy panels.
2. Tema toggle responds instantly. Theme is persisted to localStorage.
3. Scroll to the bottom: the `Elimina i miei dati` danger button is fully visible above the bottom nav (`var(--page-bottom-pad)` gives clearance).
4. Tap `Scarica JSON` → file downloads + the page records `ultimo backup` timestamp.

### 4.13 Backup reminder

1. With `vet.onboarding.seenAt` set, navigate around. After ~1.5s on any AppShell page, a backup-reminder toast appears IF no backup exists yet.
2. The toast sits above the FAB (`bottom-[calc(var(--fab-bottom)+4rem)]`), not overlapping it.
3. Tap `Scarica` → navigates to `/impostazioni`.
4. With `vet.onboarding.seenAt` UNSET (first launch) the toast must NOT appear simultaneously with the onboarding modal.

### 4.14 Agenda

1. `/agenda`: weekly strip shows L M M G V S D + dates. Today is highlighted with the accent circle.
2. Navigate weeks with the arrow buttons; `Oggi` resets to current week.
3. Empty day shows `Nessuna attività in agenda.` and a link "Nuova attività".

### 4.15 Statistiche, Conti, Cestino

Each loads with AppShell intact, primary content rendered, FAB visible.
Conti's FAB is the global voce-rapida shortcut — it does not create a Conto; this is intentional.

### 4.16 Pagamenti (`/pagamenti`)

1. Sign in as `audit.admin@example.com` (capo/admin caps) → sidebar shows `Pagamenti`. Tap it.
2. The list shows one row per azienda with a `StatoBadge`. Empty seed → empty state "Nessuna azienda da fatturare" (or similar).
3. Run `pnpm seed:conti-dev` once → reload → the demo azienda appears with badge `non saldato` (one open conto of 80,00 €).
4. Tap the row → in-row history expands and lists the open conto with its emit date and `Segna come saldato` button.
5. Toggle `Solo non saldati` at the top → list narrows to only rows with open conti.
6. Tap `Segna come saldato` → row badge flips to `saldato`. The toggle now hides the row.
7. Sign out, sign in as `simple.vet@example.com` (only `veterinario` bundle). Open `/pagamenti`.
8. The `Segna come saldato` button is NOT rendered. The page is read-only. Attempting the underlying mutation (devtools) must fail at the rules layer — covered by [`role-spec.test.ts`](../packages/rules-tests/src/role-spec.test.ts).

### 4.16 Sign-out + re-entry

1. Top bar logout icon → confirm dialog → sign out.
2. Land on `/login`. localStorage `firebase:authUser:*` cleared.
3. Re-enter via magic-link OR Google. Land on `/` (Riepilogo).

## 5. Forms — error display contract

These rules apply to every form in the app:

- Field-level errors appear directly under the field with red text, 12px, `mt-2`.
- A root-level error renders as `<InlineError>` ONCE, never duplicated.
- Multi-sentence error messages should read as a single statement; split into title + hint structurally if you must convey both. Avoid a period mid-message that mimics a second alert. (Audit candidate: `authErrors.ts` `unauthorizedEmail`, `appCheckFailed`, `storageBlocked`.)
- The form does not silently swallow server errors — every failed mutation surfaces via root error or toast.

Empty/zero-state contract:

- Each page has exactly one primary add affordance. Forms-pages use a header button (`Nuova azienda`). List-pages with a FAB do NOT also have an empty-state primary button — the FAB plays an attentive pulse instead.

## 6. Accessibility checklist

Run on each material UI change:

- Tab order makes sense; `Vai al contenuto` is the first focusable element on every AppShell page.
- All icon-only buttons have `aria-label` (top-bar icons, search, logout, theme toggle, FAB, devtools-trigger).
- All inputs have visible labels (no placeholder-only inputs).
- Color contrast: text on accent surfaces ≥ 4.5:1. Use the existing OKLCH tokens; do not introduce a new accent hue.
- Dialogs trap focus and restore focus to the trigger on close. Esc closes. Backdrop click closes only when pointerdown started on the backdrop (no accidental closes from drag).
- `aria-live="polite"` on toast container; `role="alert"` on error banners.
- `prefers-reduced-motion` cancels all decorative animations (route fade, dialog scale, FAB attention pulse).

## 7. Security tests

Security is regression-prone. Always rerun:

```bash
pnpm test:rules         # firestore.rules allow/deny per branch
pnpm -F @vet/functions test
```

Rules-tests cover every rule branch with explicit allow and deny cases — anonymous, wrong owner, missing field, oversize field, immutable audit fields. New rule? Add both cases.

Role-specific gates live in [`packages/rules-tests/src/role-spec.test.ts`](../packages/rules-tests/src/role-spec.test.ts) and exercise the capability bundles end-to-end (e.g. `veterinario` denied on `conti.saldo`, `veterinario_capo` allowed, `amministratore` allowed). Boundary tests for `tariffaStandard` (regression for the client-reported `>=1000` bug) live in both [`packages/shared/src/domain/schemas/__tests__/activityType.test.ts`](../packages/shared/src/domain/schemas/__tests__/activityType.test.ts) and [`packages/rules-tests/src/activity-types.test.ts`](../packages/rules-tests/src/activity-types.test.ts).

Manual sanity:

1. Open `/sicurezza` → run the App Check probe. In prod it should succeed; in emulator it's expected to skip gracefully.
2. Verify CSP headers on Cloudflare preview: `default-src 'none'; script-src 'self'; ...` from `packages/web/public/_headers`.

## 8. Performance budget

| Metric | Target | How |
|---|---|---|
| LCP (3G mobile) | < 2.5 s | DevTools throttling on iPhone SE viewport |
| Bundle (gzipped) | < 250 KB initial | `pnpm -F @vet/web build` + `ls -lh dist/assets/` |
| Time to interactive Riepilogo | < 3 s on cold cache | Manual stopwatch |

PWA: open in iOS Safari, "Add to Home Screen". The shell should boot offline within 1 second after install. Bumping `CACHE_VERSION` in the SW forces clients to re-cache on next open.

## 9. Pre-PR checklist

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:rules
# UI changes:
pnpm dev                      # in one terminal
pnpm test:e2e                 # in another
```

Then walk the manual golden path (section 4) on iPhone SE viewport.
If the change is risky (auth flow, security rules, Cloud Function, migration), tag it in the PR body and add a `Test plan:` section that calls out the specific cells of section 4 you actually re-ran.

## 10. Known gaps tracked in the audit (2026-05)

- Loading state strips the whole chrome on lazy route changes (section 4.10).
- Impostazioni still uses 5 stacked cards instead of hairline-divided sections (DESIGN.md anti-pattern).
- Nested dialogs (Nuova azienda on top of Voce rapida) are allowed but visually noisy — prefer inline create.
- `/admin/tipi-attivita` exposes technical ids in microcopy and has no in-page add button.
- Long multi-sentence auth error messages still read as two separate alerts when wrapping.

These are tracked separately and don't block merges, but new code should not make them worse.
