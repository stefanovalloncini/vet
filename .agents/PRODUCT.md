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

### Amministratore (limitato)

Caso d'uso raro, importante. Tiene in piedi l'allowlist degli account autorizzati, i ruoli, l'audit log. NON vede o tocca dati clinici. Vuole:

- approvare/rifiutare richieste di accesso senza dover chiamare nessuno
- vedere chi ha fatto cosa, quando, da quale dispositivo
- chiudere fuori subito un account compromesso

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
