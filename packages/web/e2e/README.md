# Playwright + Firebase emulator e2e

End-to-end tests that drive the web app against the local Firebase emulators
(Auth + Firestore). Seeded users skip the Identity Platform blocking functions
by minting custom claims directly via the Admin SDK.

## Prereqs

- Node 20+, pnpm 11+
- Java 11+ on `PATH` (Firestore emulator requirement)
- Firebase CLI available via `pnpm exec firebase` (already in the workspace dev
  dependencies)
- Playwright browsers installed once: `pnpm -F @vet/web exec playwright install chromium`
- Functions package built once: `pnpm -F @vet/functions build` (the harness
  references `packages/functions/deploy` for parity with `firebase.json`)
- Ports free locally: `5173` (Vite), `9099` (Auth), `8080` (Firestore),
  `5001` (Functions), `4400` (Hub)

## Run

```sh
pnpm -F @vet/web test:e2e:emulator
```

The harness:

1. Writes a temporary `firebase.json` and starts `auth` + `firestore` emulators.
2. Wipes both emulators, then seeds roles, allowlist entries, three users
   (admin / vet / pending), one azienda, one activity type and one attivita.
3. Boots `pnpm -F @vet/web dev` with `VITE_FIREBASE_USE_EMULATOR=true`.
4. Runs every spec under `e2e/`, then SIGINTs the background processes.

Set `E2E_VERBOSE=1` to forward emulator + Vite stdout to your terminal.

Set `E2E_NO_EMULATOR=1` to skip the global setup/teardown and instead rely on
`pnpm dev` from the repo root (only useful when you already have emulators
seeded).

## Debugging

```sh
pnpm -F @vet/web exec playwright test --ui
pnpm -F @vet/web exec playwright test --headed
pnpm -F @vet/web exec playwright test e2e/auth.spec.ts --debug
```

Auth state is primed via `addInitScript` that writes the Firebase Auth
`localStorage` entry (`firebase:authUser:<apiKey>:[DEFAULT]`). If you need a
fresh session, clear browser storage in the trace viewer.

The fixture (`e2e/setup/seed.ts`) exports `FIXTURE` so individual specs can
reference seeded ids/emails without hardcoding strings.
