import type { ReactNode, RefObject } from "react";

export type DataGridRenderMode = "table" | "cards" | "virtual";
export type SortDirection = "asc" | "desc";
export interface SortState {
  columnId: string;
  direction: SortDirection;
}
export type Align = "start" | "end" | "center";
export type Accessor<T, V = unknown> = (row: T) => V;
export interface ExportCell {
  text: string;
  numeric?: number;
}
export interface Column<T> {
  id: string;
  header: string;
  accessor: Accessor<T>;
  cell?: (row: T, index: number) => ReactNode;
  footer?: (rows: ReadonlyArray<T>) => ReactNode;
  sortable?: boolean;
  align?: Align;
  width?: number | string;
  hiddenByDefault?: boolean;
  export?: (row: T) => ExportCell;
  filterId?: string;
  headerClassName?: string;
  cellClassName?: string;
}
export type FilterValue = string | number | boolean | null | ReadonlyArray<string> | readonly [string, string];
export interface FilterDef {
  id: string;
  label: string;
  kind: "text" | "select" | "multi-select" | "date-range" | "boolean";
  options?: ReadonlyArray<{ value: string; label: string }>;
  value: FilterValue;
}
export interface RowAction<T> {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  tone?: "default" | "primary" | "danger";
}
export interface GroupingDef<T> {
  keyOf: (row: T) => string;
  labelOf: (key: string, rows: ReadonlyArray<T>) => ReactNode;
  summary?: (rows: ReadonlyArray<T>) => ReactNode;
}
export interface ExpandDef<T> {
  rowId: (row: T) => string;
  render: (row: T) => ReactNode;
}
export interface CardRenderer<T> {
  (row: T, ctx: { actions: ReadonlyArray<RowAction<T>> }): ReactNode;
}
export interface DataGridI18n {
  empty: string;
  emptyFiltered: string;
  loading: string;
  loadError: string;
  clearFilters: string;
  sortAsc: string;
  sortDesc: string;
  exportCsv: string;
  exportPdf: string;
  columns: string;
  rowsOf: (n: number, total: number) => string;
}
export interface DataGridProps<T> {
  rows: ReadonlyArray<T>;
  columns: ReadonlyArray<Column<T>>;
  getRowId: (row: T) => string;
  mode?: DataGridRenderMode;
  i18n: DataGridI18n;
  caption?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sort?: SortState | null;
  onSortChange?: (s: SortState | null) => void;
  defaultSort?: SortState;
  filters?: ReadonlyArray<FilterDef>;
  onFiltersChange?: (next: ReadonlyArray<FilterDef>) => void;
  selectedIds?: ReadonlySet<string>;
  onSelectionChange?: (next: ReadonlySet<string>) => void;
  expand?: ExpandDef<T>;
  expandedIds?: ReadonlySet<string>;
  onExpandedChange?: (next: ReadonlySet<string>) => void;
  groupBy?: GroupingDef<T>;
  rowActions?: ReadonlyArray<RowAction<T>>;
  card?: CardRenderer<T>;
  virtual?: { rowHeight: number; height: number };
  toolbar?: {
    showColumnsToggle?: boolean;
    showExport?: { csv?: boolean; pdf?: boolean };
    pdfTitle?: string;
    filenameStem?: string;
    extra?: ReactNode;
    visibilityStorageKey?: string;
  };
  emptyState?: ReactNode;
  footerNote?: ReactNode;
  apiRef?: RefObject<DataGridHandle<T> | null>;
}
export interface DataGridHandle<T> {
  toCSV: () => string;
  downloadCSV: (filename?: string) => void;
  toPDF: (opts?: { title?: string; filename?: string }) => Promise<void>;
  getVisibleRows: () => ReadonlyArray<T>;
}
