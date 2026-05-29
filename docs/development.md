# Sviluppo

## Cosa serve

- Node 20+ e pnpm 11+.
- La Firebase CLI arriva con `node_modules`, non serve installarla a parte.
- Java 21 per l'emulatore Firestore. Le versioni più recenti dell'emulatore rifiutano Java 17. Prima dei comandi che usano l'emulatore:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"
```

## Avvio in locale

```bash
pnpm install
pnpm -F @vet/shared build        # gli altri pacchetti importano dalla sua dist
cp packages/web/.env.example packages/web/.env.local
# lascia VITE_FIREBASE_USE_EMULATOR=true per lo sviluppo locale
pnpm dev                         # avvia insieme l'emulatore e vite
```

La UI dell'emulatore (Auth, Firestore, Functions) sta su `localhost:4000`.

Dopo ogni modifica sotto `packages/shared`, ricostruiscilo (`pnpm -F @vet/shared build`), altrimenti il web vede tipi ed export vecchi.

## Test

```bash
pnpm typecheck
pnpm lint
pnpm test          # unit su shared, web, functions
pnpm test:rules    # regole Firestore contro l'emulatore (serve Java 21)
```

Per la end-to-end con Playwright contro l'emulatore:

```bash
pnpm -F @vet/web exec playwright test --project=chromium
```

Il global-setup avvia da solo emulatore, vite e seed dei dati. La suite gira su quattro profili: chromium più tre profili mobili (iPhone 13, iPhone SE, Pixel 7). Lo standard per il gate di CI è `chromium`.

Ogni capability ha un caso che permette e uno che nega nei test delle regole. I test di integrazione non usano mock di Firestore.

## Dati di esempio

Gli script di seed girano contro l'emulatore quando `FIRESTORE_EMULATOR_HOST` è impostato (lo è dentro `pnpm dev`):

```bash
pnpm seed:roles            # i tre ruoli di base
pnpm seed:activity-types   # i tipi di attività
```

Per puntare alla produzione serve il flag esplicito e il progetto giusto, e lo script rifiuta di partire senza:

```bash
FIREBASE_PROJECT_ID=vet-marinoni pnpm seed:roles --prod
```

In produzione il seed usa le Application Default Credentials (`gcloud auth application-default login`, oppure `GOOGLE_APPLICATION_CREDENTIALS`).

## Deploy

Il web si pubblica da solo su push a `main`, quando la CI passa (vedi [architecture.md](architecture.md)). Functions, regole e indici vanno a mano con la Firebase CLI, nell'ordine: prima regole e indici, poi le functions, il web per ultimo.
