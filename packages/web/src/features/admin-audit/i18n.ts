export const auditI18n = {
  title: "Audit log",
  subtitle: "Eventi sensibili registrati dal server.",
  loading: "Caricamento…",
  loadError: "Caricamento fallito.",
  empty: "Nessun evento ancora.",
  azione: "Azione",
  attore: "Attore",
  target: "Target",
  quando: "Quando",
  dettagli: "Dettagli",
  filtroTutti: "Tutte",
  filtroAzione: "Filtra per azione",
  filtroTarget: "Filtra per target",
} as const;

import type { AuditAction } from "@vet/shared";

export const ACTION_LABELS: Record<AuditAction, string> = {
  "role.update": "Ruolo modificato",
  "role.create": "Ruolo creato",
  "role.assign": "Ruolo assegnato",
  "allowlist.add": "Email autorizzata",
  "allowlist.remove": "Email rimossa",
  "attivita.delete": "Attività eliminata",
  "attivita.restore": "Attività ripristinata",
  "attivita.purge": "Attività cancellata definitivamente",
  "attivita.purge.auto": "Pulizia automatica cestino",
  "user.session.revoke": "Sessione revocata",
  "gdpr.erasure": "Cancellazione GDPR",
};
