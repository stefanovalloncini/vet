# Modello di sicurezza

L'autorizzazione sta sul server. La UI può nascondere o mostrare comandi, ma chi decide cosa è permesso sono le regole Firestore e le Cloud Functions. Un client modificato non deve poter aggirare nulla.

## Identità

L'accesso è con Google o link via email. L'identità di un utente è il suo `auth.uid`, e basta quello. Il nome mostrato in interfaccia viene dal profilo di autenticazione. Non esiste un campo "veterinario" che il client possa scrivere o falsificare.

Per entrare un utente deve essere in allowlist e approvato. `beforeSignIn` blocca chi non lo è prima che la sessione esista.

## Ruoli e capability

Un utente ha un ruolo: `users/{uid}.roleId`. La definizione del ruolo sta in `roles/{roleId}` e contiene la lista delle capability (per esempio `attivita.write.own`, `conti.emit`, `roles.manage`). Le capability vengono codificate nell'ID token come codici brevi.

Le regole Firestore non ragionano sui nomi dei ruoli: controllano le capability. Così rinominare un ruolo non tocca le regole, e aggiungere un permesso è una modifica al solo documento del ruolo.

Quando un documento di ruolo cambia, `onRoleChange` ricodifica i claim di tutti i membri di quel ruolo e revoca i loro refresh token, così il nuovo set di permessi vale al successivo refresh dell'ID token.

I tre ruoli di base sono `veterinario_semplice`, `titolare` (può emettere e saldare conti) e `amministratore` (gestisce ruoli, allowlist e tipi di attività). Le definizioni stanno in `packages/shared` e si seminano con `pnpm seed:roles`.

## Regole Firestore

Le regole negano di default. Ogni accesso parte da `request.auth != null` e dalla capability giusta.

- Lettura: l'utente autenticato con la capability di lettura vede i record.
- Scrittura e modifica: oltre alla capability, la regola verifica la proprietà (`resource.data.ownerUid == request.auth.uid`) per le capability "own".
- I campi di audit (`createdAt`, `createdBy`, `updatedAt`) sono scritti dal server e non si possono cambiare dal client.
- Le collezioni di sola gestione server (per esempio `mail`, `audit`) non sono raggiungibili dal client.

Ogni ramo delle regole ha sia un caso che permette sia uno che nega nei test (`packages/rules-tests`), girati contro l'emulatore. I test di integrazione non usano mock di Firestore: un mock lascerebbe passare un errore nelle regole.

## App Check

App Check è attivo su Firestore e su Identity Platform. Le callable lo richiedono anche al gateway. In locale si usano i debug token; in produzione reCAPTCHA Enterprise.

## CSP e header

La PWA gira sotto una Content-Security-Policy stretta servita da `packages/web/public/_headers`: `default-src 'none'`, `script-src 'self'`, `connect-src` limitato agli endpoint Firebase, niente sorgenti esterne. Insieme alla CSP ci sono HSTS con preload, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e una `Permissions-Policy` che nega camera, geolocalizzazione, microfono, pagamenti e USB.

L'SDK Firebase è nel bundle, non caricato a runtime da gstatic. Niente script, analytics o font di terze parti a runtime; i font sono self-hosted.

## Input

Ogni dato che entra passa per uno schema Zod con `.strict()` prima di toccare Firestore, sia dal frontend sia dalle Functions. Gli schemi hanno limiti di lunghezza sulle stringhe e limiti numerici su tariffa e ore, e rifiutano i campi non previsti. `dangerouslySetInnerHTML` è vietato da una regola ESLint; `eval` e `new Function` non si usano.

## Errori e log

Gli errori arrivano all'utente come messaggio generico in un toast. Nessun messaggio espone dettagli interni o dati personali. Il dettaglio per il debug va in un log strutturato lato server, non visibile all'utente.

## Recupero dati

La cancellazione è soft: i record finiscono in un cestino e restano recuperabili per 7 giorni prima della rimozione definitiva. C'è un log di audit delle operazioni sensibili. I backup gestiti di Firestore e gli export su GCS sono progettati ma non attivi all'MVP, per tenere il costo a zero finché non ci sono dati di produzione veri.
