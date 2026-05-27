import type { DataGridI18n } from "./types";

export const dataGridIt: DataGridI18n = {
  empty: "Nessun risultato",
  emptyFiltered: "Nessun risultato per i filtri selezionati",
  loading: "Caricamento…",
  loadError: "Errore di caricamento",
  clearFilters: "Reimposta filtri",
  sortAsc: "Ordina crescente",
  sortDesc: "Ordina decrescente",
  exportCsv: "Esporta CSV",
  exportPdf: "Esporta PDF",
  columns: "Colonne",
  rowsOf: (n: number, total: number) => `${n} di ${total} righe`,
};
