# Architettura

## Monorepo

Workspace pnpm con quattro pacchetti:

```
packages/
  web/          frontend Vite, la PWA
  shared/       schemi Zod, registro delle capability, entità e tipi condivisi
  functions/    Cloud Functions (beforeSignIn, onRoleChange, callable, job schedulati)
  rules-tests/  test delle regole Firestore contro l'emulatore
firestore.rules           deny-by-default, controlli per capability
firestore.indexes.json
```

`@vet/shared` è la fonte unica per gli schemi, le entità di dominio e le capability. Web e functions lo importano dalla sua `dist`, quindi dopo una modifica a `shared` va ricostruito (`pnpm -F @vet/shared build`).

## Come parla con i dati

Il frontend parla direttamente con Firestore tramite il client SDK. L'SDK però non compare nei componenti: sta dietro al livello `infrastructure/`, e le feature lo usano attraverso i repository e gli hook. Così un componente non sa se dietro c'è Firestore o un doppio in memoria, e i test possono sostituire l'uno con l'altro.

I livelli, dall'alto in basso:

```
Feature (web/features, functions/handlers, scripts)
  -> composizione (useRepositories nel web, getRepositories nelle functions)
  -> repository (infrastructure/firestore, in memoria in @vet/shared/testing)
  -> porte ed entità di dominio (@vet/shared/domain)
  -> DTO e schemi (@vet/shared/firestore-dto)
```

Gli schemi e i DTO sono l'unico punto che legge dati grezzi (`parseXxx`) e l'unico che produce un payload per Firestore (`toXxxDocument`). Tutto il resto lavora su entità già validate.

## Frontend

Il web è organizzato per feature: `packages/web/src/features/<feature>/{hooks,lib,ui,__tests__}`. La UI condivisa (data grid, dialog, form, sidebar) sta in `shared/ui`, le utility in `shared/lib`, la composizione e l'infrastruttura in `infrastructure/`. Lo stato server passa per TanStack Query; i form per react-hook-form più Zod.

I componenti restano piccoli: uno per file, sotto le ~150 righe. Lo stato non si deriva dentro un `useEffect`, si calcola con `useMemo` o inline.

## Deploy

Il bundle web parte su push a `main`: la CI gira (typecheck, lint, unit, regole, build, e2e su chromium) e, solo se passa, un workflow di deploy pubblica su Cloudflare Workers Static Assets. Niente CI verde, niente deploy.

Functions, regole e indici si deployano a parte con la Firebase CLI, dal working tree:

```bash
pnpm exec firebase deploy --only firestore:rules --project vet-marinoni
pnpm exec firebase deploy --only functions --project vet-marinoni
```

L'ordine conta: prima regole e indici, poi le functions, il web per ultimo. Mandare il web prima delle regole farebbe fallire in produzione le scritture che usano campi nuovi.

## Regioni

Firestore e quasi tutte le functions stanno in `europe-west8` (Milano), vicino ai dati e agli utenti. Le sole eccezioni sono le functions schedulate, in `europe-west1`, perché Cloud Scheduler non supporta `europe-west8`.
