export const rolesI18n = {
  title: "Ruoli",
  subtitle: "Definizione capacità per ruolo.",
  empty: "Nessun ruolo definito.",
  loading: "Caricamento…",
  loadError: "Caricamento fallito.",
  saveError: "Salvataggio non riuscito.",
  nuovoRuolo: "Nuovo ruolo",
  modifica: "Modifica",
  vediSolo: "Vedi sola lettura",
  capability: "Capacità",
  nessunaCap: "Nessuna capacità selezionata",
  // editor
  titoloNuovo: "Nuovo ruolo",
  titoloModifica: "Modifica ruolo",
  campoId: "Identificativo",
  campoIdHint: "Lowercase, lettere e trattini. Es. vet-junior",
  campoNome: "Nome visibile",
  campoDescrizione: "Descrizione",
  sezioneCap: "Capacità",
  salva: "Salva",
  annulla: "Annulla",
  back: "Torna ai ruoli",
  blocked: "Ruolo bloccato (locked) — non modificabile.",
  groupActivities: "Attività",
  groupAziende: "Aziende",
  groupTipi: "Tipi attività",
  groupTrash: "Cestino",
  groupRoles: "Ruoli",
  groupAllowlist: "Allowlist",
  groupAudit: "Audit",
  groupUsers: "Utenti",
} as const;

export const CAP_GROUPS: ReadonlyArray<{
  label: keyof typeof rolesI18n;
  prefix: string;
}> = [
  { label: "groupActivities", prefix: "activities." },
  { label: "groupAziende", prefix: "aziende." },
  { label: "groupTipi", prefix: "activity_types." },
  { label: "groupTrash", prefix: "trash." },
  { label: "groupRoles", prefix: "roles." },
  { label: "groupAllowlist", prefix: "allowlist." },
  { label: "groupAudit", prefix: "audit." },
  { label: "groupUsers", prefix: "users." },
];
