# Requisiti e vincoli

Cosa deve fare l'applicazione e quali regole è obbligata a rispettare. I vincoli di sicurezza non sono opzionali: vengono dagli errori della versione precedente e devono restare validi a ogni modifica.

## Cosa fa

Vet tiene il registro delle attività di uno studio veterinario.

Ogni voce ha una data, l'azienda (il cliente), il tipo di attività, note libere e, quando l'attività è oraria, la tariffa con le ore. Da queste voci l'app ricava:

- viste raggruppate e filtrate per azienda, per giorno e per veterinario;
- l'export CSV tarato sull'Excel italiano (separatore `;`, BOM, virgola come decimale);
- le statistiche di sintesi: numero di voci, aziende e veterinari distinti, totale fatturato;
- i conti per azienda, con periodo di fatturazione e stato saldato / non saldato.

È installabile come PWA e funziona offline: la shell resta in cache e le scritture fatte senza rete vanno in coda, per partire alla riconnessione.

Più veterinari condividono lo stesso archivio. Ognuno legge tutto, ma modifica o cancella solo le proprie voci.

## Cosa sostituisce

La prima versione era una pagina HTML singola con Firebase, e aveva problemi gravi: Firestore raggiungibile senza autenticazione né regole, XSS persistente in ogni lista (DOM costruito con `innerHTML` e valori non sanificati), cancellazione autorizzata solo nella UI, identità scritta a mano in `localStorage`. Chiunque poteva leggere, scrivere o cancellare qualsiasi record, e spacciarsi per un altro.

Questa versione è fatta perché quegli errori non possano tornare. I vincoli qui sotto sono la traduzione diretta di quelle lezioni.

## Vincoli di sicurezza (non negoziabili)

- Nessun accesso anonimo a Firestore. Le regole negano di default. Ogni lettura e scrittura richiede `request.auth != null`, e ogni modifica verifica che chi scrive sia il proprietario del record.
- L'identità è `auth.uid`. Il nome del veterinario mostrato viene dal profilo di autenticazione, mai da un campo passato dal client.
- L'autorizzazione vive nelle regole Firestore, non nella UI. La UI può nascondere un pulsante, ma è la regola a decidere.
- CSP stretta e header di sicurezza completi: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` ridotta.
- Niente `innerHTML` con dati dell'utente, niente `dangerouslySetInnerHTML`, niente `eval`. Nel JSX l'escape lo fa React.
- App Check attivo (reCAPTCHA Enterprise in produzione).
- SDK Firebase incluso nel bundle, non caricato a runtime da una CDN.
- Validazione con Zod a ogni bordo di input, con `.strict()`, prima di scrivere su Firestore. Limiti di lunghezza sulle stringhe, limiti numerici su tariffa e ore.
- Niente dati personali nei log o negli alert. L'errore arriva all'utente come messaggio generico in un toast; il dettaglio va in un log strutturato non visibile.
- I campi di audit (`createdAt`, `createdBy`, `updatedAt`) li scrive il server e sono immutabili nelle regole.

Come tutto questo è implementato sta in [security.md](security.md).

## GDPR

Le aziende e le note libere sono dati di terzi (i clienti dello studio), e vanno trattati come tali.

- I dati stanno su Firestore in `europe-west8` (Milano), una sola regione europea.
- I campi sono ridotti al minimo, con limiti di lunghezza.
- L'utente può cancellare i propri record (Art. 17). C'è un cestino con recupero entro 7 giorni prima della cancellazione definitiva.
- L'export CSV copre il diritto di accesso ai dati (Art. 15).

## Costi

A regime il progetto deve stare a 0 €/mese. Una spesa di più di qualche centesimo è un bug da indagare, non una bolletta da pagare.

- Quote dure su ogni API a pagamento, fissate a 2-5 volte l'uso previsto. Oltre la quota l'operazione viene rifiutata.
- Alert di budget a 1 €/mese via email.
- Kill switch: a 5 €/mese una Cloud Function attivata da Pub/Sub disabilita la fatturazione sul progetto. Il ripristino è manuale.
