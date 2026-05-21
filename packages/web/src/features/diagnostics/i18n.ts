export const diagI18n = {
  eyebrow: "Verifica sicurezza",
  title: "Stato del browser",
  subtitle:
    "Verifichiamo i componenti che servono per accedere. Se qualcosa va male, te lo diciamo qui.",
  running: "Verifica in corso…",
  retry: "Riprova",
  backToLogin: "Torna all'accesso",
  allOk: "Tutto a posto. Puoi tornare all'accesso.",
  probes: {
    cookies: "Cookie del browser",
    localStorage: "Memoria locale del browser",
    appCheckToken: "Token anti-bot (App Check)",
  },
  remediation: {
    cookies:
      "I cookie sono disabilitati. In modalità privata di Safari o Firefox con protezione anti-tracciamento rigorosa potrebbero essere bloccati. Disattiva la protezione per questo sito o usa un altro browser.",
    localStorage:
      "Il browser non permette di salvare dati locali. Spesso causato da modalità privata o estensioni di privacy. Prova in una finestra normale.",
    appCheckToken:
      "Il browser non riesce a completare la verifica anti-bot. Cause tipiche: estensioni come uBlock Origin, Brave Shields, Privacy Badger, Ghostery, oppure un proxy aziendale che blocca google.com. Disabilita le estensioni di privacy per questo sito, oppure prova con un altro browser (Chrome consigliato).",
  },
} as const;
