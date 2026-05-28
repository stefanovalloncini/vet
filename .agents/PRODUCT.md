# PRODUCT — Vet

## register

product

## Product purpose

Tracker delle attività cliniche per veterinari italiani che lavorano in stalla. Registra prestazioni (data, azienda, tipo, ore, tariffa, note), genera riepiloghi e CSV per la contabilità, e funziona offline su telefono. Multi-utente: ogni veterinario vede il dataset condiviso ma modifica solo i propri record. Niente fatturazione, niente PDF marketing, niente social.

## Users

Tre ruoli con bisogni diversi. Tutti sono in mobilità per gran parte della giornata, spesso con guanti, scarso segnale, una mano libera.

### Veterinario semplice

Il caso d'uso primario. Visita stalle, registra interventi nei ritagli di tempo. Vuole:

- aprire l'app e segnare un'attività in meno di 20 secondi
- vedere subito le ultime prestazioni della giornata
- correggere un errore senza paura di rompere qualcosa
- esportare il riepilogo del mese per la propria contabilità

Non vuole: dashboard piene di grafici, animazioni inutili, schermate di benvenuto, tooltip generici.

### Veterinario capo (titolare)

Il caso d'uso secondario. Gestisce un piccolo team. Vuole:

- vedere il riepilogo di tutta la clinica per azienda o per veterinario
- correggere/annullare attività di altri (solo lui)
- gestire i tipi di attività e le tariffe di default
- esportare per intervalli temporali e per azienda specifica

Stessa preoccupazione del veterinario semplice: rapidità, niente fronzoli. In più: la responsabilità di tenere puliti i dati.

### Amministratore

Superset del capo. Stessi permessi clinici, piu` la parte tecnica: allowlist, ruoli, audit log. Caso d'uso raro ma critico. Vuole:

- approvare/rifiutare richieste di accesso senza dover chiamare nessuno
- vedere chi ha fatto cosa, quando, da quale dispositivo
- chiudere fuori subito un account compromesso
- intervenire sui conti del capo se il capo non e` disponibile

In pratica e` quasi sempre lo sviluppatore o il capo stesso con il cappello da admin.

## Capability matrix

Fonte di verita`: [`packages/shared/src/domain/caps/bundles.ts`](../packages/shared/src/domain/caps/bundles.ts). Tabella sotto in sintesi (✓ = abilitato, vuoto = negato).

| Azione | veterinario | veterinario_capo | amministratore |
|---|---|---|---|
| Vedere tutte le attivita` | ✓ | ✓ | ✓ |
| Creare attivita` | ✓ | ✓ | ✓ |
| Modificare/eliminare attivita` proprie | ✓ | ✓ | ✓ |
| Esportare CSV attivita` | ✓ | ✓ | ✓ |
| Vedere/creare/modificare aziende | ✓ | ✓ | ✓ |
| Leggere tipi attivita` | ✓ | ✓ | ✓ |
| Cestino proprie attivita` | ✓ | ✓ | ✓ |
| Emettere proforma | ✓ | ✓ | ✓ |
| Emettere conto ufficiale | | ✓ | ✓ |
| Segnare conto saldato | | ✓ | ✓ |
| Vedere/creare/modificare promemoria propri | ✓ | ✓ | ✓ |
| Approvare nuovi utenti | | | ✓ |
| Gestire ruoli/capability | | | ✓ |
| Gestire allowlist email | | | ✓ |
| Leggere audit log | | | ✓ |

I bundle compongono: `veterinario_capo ⊃ veterinario`, `amministratore ⊃ veterinario_capo`. Aggiungere una capability a un bundle base la propaga automaticamente ai bundle superiori.

## Per-page contracts

Cinque pagine principali + Impostazioni. Per ognuna: cosa mostra, chi puo` fare cosa, dove sono i test.

### Riepilogo (`/`)

Dashboard di apertura. Mostra **solo dati dell'utente corrente**:

- Attivita` registrate nel mese corrente (count).
- Aziende attive (cioe` con almeno un'attivita` propria nel mese corrente).
- Grafico ultimi 12 mesi, switch tra "attivita`" e "incassi".

Stessa lettura per tutti e tre i ruoli, scoped per `ownerUid`. Niente bottoni di azione: la dashboard e` di sola lettura.

Test: [`packages/web/src/features/dashboard/hooks/__tests__/useDashboardStats.test.tsx`](../packages/web/src/features/dashboard/hooks/__tests__/useDashboardStats.test.tsx).

### Agenda (`/agenda`)

Strip settimanale L–D con l'attivita` di ogni giorno. Naviga settimane con le freccette; `Oggi` torna alla corrente. Empty-day mostra "Nessuna attivita` in agenda" e link "Nuova attivita`" (apre la voce rapida).

Niente bottone stampa: si usa la voce rapida e basta. Stessa vista per tutti i ruoli.

### Aziende (`/aziende`)

Lista aziende con bollino verde/rosso accanto al nome:

- Verde se tutti i conti emessi sono saldati o non ci sono conti.
- Rosso se almeno un conto e` ancora non saldato.

Tap su un'azienda apre il dettaglio. Dal dettaglio: `Emetti proforma` (PDF senza scrittura su `conti`) oppure `Emetti conto` (crea il record in `conti`, lo manda in `/pagamenti`). Entrambi richiedono di scegliere il periodo (default: ultimi 3 o 6 mesi a seconda di `cadenzaFatturazione` dell'azienda; modificabile).

Bottone "import CSV aziende" rimosso. La creazione e` solo via `Nuova azienda`.

Permessi:

- `veterinario` puo` aprire, creare, modificare aziende, emettere proforma.
- `veterinario_capo` + `amministratore` possono anche emettere conto.

Test: [`packages/web/src/features/aziende/...`](../packages/web/src/features/aziende/), [`packages/web/src/features/conti/lib/__tests__/contoPreview.test.ts`](../packages/web/src/features/conti/lib/__tests__/contoPreview.test.ts).

### Pagamenti (`/pagamenti`)

Lista per-azienda dello stato pagamenti. Ogni riga mostra:

- Bollino tri-state: `saldato` (tutti i conti chiusi), `non saldato` (almeno uno aperto), `da emettere` (e` passato il periodo di fatturazione senza che sia stato emesso un conto).
- Totale aperto in EUR.
- Data dell'ultimo conto emesso.

Toggle "Solo non saldati" filtra alle aziende con almeno un conto aperto. Tap su una riga espande lo storico conti per quell'azienda (saldato / non saldato per ognuno).

Bottone "Segna come saldato":

- Solo `veterinario_capo` e `amministratore` lo vedono (UI gate via `caps.has("conti.saldo")`).
- Le regole Firestore impongono la stessa restrizione (`hasCap("cs")` su update di `conti/{id}` con `saldato == true`).

Test: [`packages/web/src/features/pagamenti/__tests__/`](../packages/web/src/features/pagamenti/__tests__/), [`packages/rules-tests/src/role-spec.test.ts`](../packages/rules-tests/src/role-spec.test.ts).

### Attivita` (`/attivita`)

Lista cronologica di tutte le attivita` (di tutti i veterinari, in lettura). Filtri: periodo, azienda, tipo, veterinario, raggruppa-per. Export CSV.

Niente bottone "Nuova attivita`" — la creazione e` solo via FAB voce rapida. Stessa vista per tutti i ruoli; i bottoni di modifica/elimina sono visibili solo sull'attivita` di proprieta`.

### Voce rapida (FAB globale)

L'unico ingresso per creare un'attivita`. Apri da qualsiasi pagina con il `+` in basso a destra.

- Data: default oggi, editabile.
- Azienda: select con suggerimenti recenti + `+ Nuova` per crearla inline.
- Tipo: `Ginecologia` pinnato primo, gli altri alfabetici, `Altro` pinnato ultimo. Se selezioni `Altro`, la nota diventa obbligatoria (errore: "La nota e` obbligatoria per il tipo Altro").
- Modalita` tariffa: `Oraria` / `Ad elemento` / `Fissa`, mutuamente esclusive. Cambiando tipo, la tariffa standard del tipo viene proposta automaticamente nel campo Tariffa.
- Tariffa standard: range valido `[0, 100000]` EUR (regressione del bug "minimo 1000€" — non si ripresenta).
- Note: liberi, obbligatori solo per `Altro`.

Tutti i ruoli possono usarla.

Test: [`packages/web/src/features/quick-entry/`](../packages/web/src/features/quick-entry/), [`packages/shared/src/domain/schemas/__tests__/activityType.test.ts`](../packages/shared/src/domain/schemas/__tests__/activityType.test.ts), [`packages/rules-tests/src/activity-types.test.ts`](../packages/rules-tests/src/activity-types.test.ts).

### Impostazioni (`/impostazioni`)

Pannelli: Account, Tema, Cestino, Backup, Privacy, eliminazione dati (GDPR Art. 17). Backup manuale produce un JSON + CSV scaricabile. Amministratore vede in piu` le voci tecniche (`Sicurezza`, `Audit`, `Allowlist`, `Ruoli`).

## Brand voice

Italiano, asciutto, da app medicale di nicchia. Frasi corte. Imperativo quando serve un'azione, indicativo quando descrive uno stato. Verbi prima dei sostantivi.

### Banned patterns

- "Nota che..." / "Tieni presente che..." / "È importante sapere che..."
- Frasi che si scusano: "Per favore, prova...", "Ci dispiace, ma..."
- Trattini lunghi a metà frase. Punti, virgole, due punti, parentesi. Mai em dash.
- Punteggiatura emotiva: niente "!", niente "..."
- Promotion-speak: "delightful", "powerful", "intuitive", "seamless", "effortless"
- Italiano forzato che suona come Google Translate: "ottieni informazioni", "esplora le opzioni"
- Inglesismi quando esiste la parola italiana: "salva" non "save", "elimina" non "delete"
- Marketing tone: "Scopri", "Esplora", "Inizia subito"
- Emoji ovunque, comprese le icone testuali tipo (i) o (!)

### Ok patterns

- "Salva", "Annulla", "Elimina", "Modifica", "Nuovo"
- Stato: "3 attivita oggi", "Nessuna prestazione registrata"
- Errori specifici e brevi: "Tariffa fuori limite", "Connessione assente"
- Etichette tutte minuscole o maiuscole iniziale, mai TITLE CASE

## Anti-references

Cose che NON devono assomigliare a questo prodotto. Se il design ricorda uno di questi, è sbagliato.

- **Material Design generico** di Google: card galleggianti, FAB rotondi neri, ombre pesanti, ripple effects, motion ovunque. Lo stack già evita questo, ma il riflesso è di tornarci. No.
- **Template AI-generated**: gradient pastello, neon, glassmorphism, hero metric con numero gigante e sotto-label decorativa, illustrazioni 3D, dark mode automatico "perche sembra fico".
- **SaaS B2B made-in-USA**: tono "Welcome back, Stefano!", celebrazioni con coriandoli, tooltip onboarding ovunque, modal di first-run.
- **Healthcare design cliche**: bianco-e-teal come riflesso da training data, croci rosse, stetoscopi disegnati, simboli farmaceutici. Il teal qui c'e ma e' una scelta calibrata, non lo stock-icon.
- **App da consumatore**: bottom sheet che si possono trascinare giu, gesture nascoste, feedback aptici fittizi, suoni.
- **Dashboard analitica**: KPI giganti, grafici che si animano al caricamento, sparkline ovunque, percentuali con frecce verdi/rosse.
- **Enterprise legacy**: tabelle dense senza spazio, modale-su-modale, breadcrumb di quattro livelli, riepilogo a tre colonne.

## Strategic principles

1. **Velocita prima di tutto.** Una stalla non aspetta. Il flusso di registrazione e' la priorita assoluta; ogni tap risparmiato vale piu' di qualsiasi animazione.
2. **Offline-first nel comportamento.** L'app gira spesso senza segnale. La UI non deve mai promettere quello che non sa garantire (niente toast "Salvato!" se il write e' in coda).
3. **Touch target sempre 44px.** Le mani possono essere fredde, sporche, dentro guanti.
4. **Niente fronzoli sul mobile.** Il mobile e' lo strumento di lavoro. Il desktop e' lo strumento di amministrazione. Layout e densita possono differire, ma il livello di rumore visivo no: e' basso ovunque.
5. **Errori brevi e specifici.** Niente stack trace. Niente "Si e' verificato un errore". Specifica il campo o l'azione che ha fallito.
6. **Distinguibilita dei ruoli.** Le azioni che richiedono privilegi (eliminare attivita di altri, modificare ruoli) devono essere visivamente piu' caute, non piu' decorate.
7. **Italiano vero.** L'app e' italiana di nascita, non tradotta. Date in formato europeo. Decimali con la virgola. Mesi e giorni in italiano.
