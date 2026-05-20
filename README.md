# Vet

Activity tracker for a veterinary practice. Italian UI, multi-user, installable as a PWA, data in Firestore (`europe-west8`).

Replaces an earlier single-file Firebase prototype that shipped several critical bugs (stored XSS, wide-open Firestore rules, identity as a free-text string in localStorage). This version is built so those particular mistakes can't come back.

Live: https://gestionale.stefanovalloncini.com

## Stack

- Vite 6, React 18, TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Firebase Auth (Google + email link), Firestore, Cloud Functions Gen 2, App Check via reCAPTCHA Enterprise
- Zod at every input boundary
- Vitest for unit, `@firebase/rules-unit-testing` for rules, Playwright for end-to-end against the emulator
- pnpm workspaces, Cloudflare Workers Static Assets for hosting

## Layout

```
packages/
  web/          Vite frontend, the PWA itself
  shared/       Zod schemas, capabilities registry, shared types
  functions/    Cloud Functions (beforeSignIn, onRoleChange, callables, scheduled jobs)
  rules-tests/  Firestore rules tests against the emulator
firestore.rules           deny-by-default, per-capability checks
firestore.indexes.json
```

## Development

Node 20+, pnpm 11+. Firebase CLI ships in `node_modules`.

```bash
pnpm install
pnpm -F @vet/shared build      # other packages import from dist
cp packages/web/.env.example packages/web/.env.local
# keep VITE_FIREBASE_USE_EMULATOR=true for local
pnpm dev                       # starts the emulator suite and vite together
```

Emulator UI lands at `localhost:4000` (Auth, Firestore, Functions).

## Tests

```bash
pnpm typecheck
pnpm lint
pnpm test          # unit across shared, web, functions
pnpm test:rules    # Firestore rules against the emulator
```

Every capability has both an allow case and a deny case in the rules tests. Integration tests don't mock Firestore.

## Deploy

The web bundle ships via Cloudflare Workers Builds on push to `main`. Functions and rules deploy manually:

```bash
pnpm exec firebase deploy --only functions --project vet-marinoni
pnpm exec firebase deploy --only firestore:rules --project vet-marinoni
```

Scheduled functions sit in `europe-west1` because Cloud Scheduler doesn't support `europe-west8`. Everything else is in `europe-west8` next to Firestore.

## Security model

Rules deny by default. Every read or write asserts `request.auth.token.vet == true` plus a specific capability code. Identity is `auth.uid`, the displayed vet name comes from the auth profile, never from a client-supplied field. App Check is enforced on Firestore and Identity Platform; the callable functions also enforce it at the gateway.

A user's role lives in `users/{uid}.roleId`, the role definition lives in `roles/{roleId}`, and the capability list is encoded into the ID token as short codes. Editing a role document triggers `onRoleChange`, which re-encodes claims for every member of that role and revokes their refresh tokens.

## Cost posture

This stays at €0/month in steady state or something is wrong. Hard quotas on every billable API at 2-5× expected usage, a $1/month budget alert by email, and a Pub/Sub-triggered kill switch that disables billing at $5/month. A spike of more than a few cents is a bug, not a bill to pay.
