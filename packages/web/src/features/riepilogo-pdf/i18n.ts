export const riepilogoI18n = {
  title: "Riepilogo prestazioni",
  cliente: "Cliente",
  periodo: "Periodo",
  data: "Data",
  tipo: "Tipo",
  note: "Note",
  ore: "Ore",
  tariffa: "Tariffa",
  totale: "Totale",
  partitaIva: "P.IVA",
  veterinario: "Veterinario",
  documento: "Documento non fiscalmente valido. Riepilogo prestazioni.",
  stampa: "Stampa o salva PDF",
  back: "Torna indietro",
  notFound: "Cliente non trovato.",
  loadError: "Caricamento del riepilogo non riuscito.",
  noData: "Nessuna attività nel periodo.",
  includeBilled: "Includi già fatturate",
  excludedNotice: (n: number): string =>
    n === 1
      ? "1 attività già fatturata esclusa"
      : `${n} attività già fatturate escluse`,
} as const;
