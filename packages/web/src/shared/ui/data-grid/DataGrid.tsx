import { useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { DataLoader } from "../DataLoader";
import { EmptyState } from "../EmptyState";
import { Button } from "../Button";
import { FilterBar } from "./FilterBar";
import { DataGridToolbar } from "./Toolbar";
import { TableMode } from "./modes/TableMode";
import { CardsMode } from "./modes/CardsMode";
import { VirtualMode } from "./modes/VirtualMode";
import { applyFilters, applySort, visibleColumns } from "./engine";
import { downloadCsv, toCsv } from "./export/csv";
import { exportToPdf } from "./export/pdf";
import type {
  DataGridProps,
  FilterDef,
  SortState,
} from "./types";

function loadHiddenFromStorage(key: string | undefined): Set<string> {
  if (!key) return new Set();
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((x): x is string => typeof x === "string"));
    }
  } catch {
    // ignore corrupt storage
  }
  return new Set();
}

function persistHiddenToStorage(key: string | undefined, hidden: ReadonlySet<string>): void {
  if (!key) return;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(Array.from(hidden)));
    }
  } catch {
    // ignore quota errors
  }
}

export function DataGrid<T>(props: DataGridProps<T>) {
  const {
    rows,
    columns,
    getRowId,
    mode = "table",
    i18n,
    caption,
    loading = false,
    error = null,
    onRetry,
    sort: sortProp,
    onSortChange,
    defaultSort,
    filters: filtersProp,
    onFiltersChange,
    expand,
    expandedIds: expandedIdsProp,
    onExpandedChange,
    groupBy,
    rowActions,
    card,
    cardsLayout,
    virtual,
    toolbar,
    emptyState,
    footerNote,
    apiRef,
  } = props;

  const sortControlled = sortProp !== undefined;
  const [internalSort, setInternalSort] = useState<SortState | null>(
    defaultSort ?? null
  );
  const sort = sortControlled ? sortProp ?? null : internalSort;

  // emit default sort once on mount when controlled handler is present
  useEffect(() => {
    if (sortControlled) return;
    if (defaultSort && onSortChange) onSortChange(defaultSort);
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSort = useCallback(
    (columnId: string) => {
      const current = sort;
      let next: SortState | null;
      if (!current || current.columnId !== columnId) {
        next = { columnId, direction: "asc" };
      } else if (current.direction === "asc") {
        next = { columnId, direction: "desc" };
      } else {
        next = null;
      }
      if (!sortControlled) setInternalSort(next);
      onSortChange?.(next);
    },
    [sort, sortControlled, onSortChange]
  );

  const filtersControlled = filtersProp !== undefined;
  const [internalFilters, setInternalFilters] = useState<ReadonlyArray<FilterDef>>(
    () => filtersProp ?? []
  );
  const filters = useMemo<ReadonlyArray<FilterDef>>(
    () => (filtersControlled ? filtersProp ?? [] : internalFilters),
    [filtersControlled, filtersProp, internalFilters]
  );

  const handleFiltersChange = useCallback(
    (next: ReadonlyArray<FilterDef>) => {
      if (!filtersControlled) setInternalFilters(next);
      onFiltersChange?.(next);
    },
    [filtersControlled, onFiltersChange]
  );

  const expandedControlled = expandedIdsProp !== undefined;
  const [internalExpanded, setInternalExpanded] = useState<ReadonlySet<string>>(
    new Set()
  );
  const expandedIds = useMemo<ReadonlySet<string>>(
    () =>
      expandedControlled ? expandedIdsProp ?? new Set<string>() : internalExpanded,
    [expandedControlled, expandedIdsProp, internalExpanded]
  );

  const toggleExpand = useCallback(
    (id: string) => {
      const next = new Set(expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (!expandedControlled) setInternalExpanded(next);
      onExpandedChange?.(next);
    },
    [expandedIds, expandedControlled, onExpandedChange]
  );

  const storageKey = toolbar?.visibilityStorageKey;
  const [hiddenColumns, setHiddenColumns] = useState<ReadonlySet<string>>(() => {
    const stored = loadHiddenFromStorage(storageKey);
    if (stored.size > 0) return stored;
    return new Set(columns.filter((c) => c.hiddenByDefault).map((c) => c.id));
  });

  const toggleColumn = useCallback(
    (id: string) => {
      const next = new Set(hiddenColumns);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setHiddenColumns(next);
      persistHiddenToStorage(storageKey, next);
    },
    [hiddenColumns, storageKey]
  );

  const filtered = useMemo(
    () => applyFilters(rows, columns, filters),
    [rows, columns, filters]
  );
  const sorted = useMemo(
    () => applySort(filtered, columns, sort),
    [filtered, columns, sort]
  );
  const colsVisible = useMemo(
    () => visibleColumns(columns, hiddenColumns),
    [columns, hiddenColumns]
  );

  const buildCsv = useCallback(() => toCsv(colsVisible, sorted), [colsVisible, sorted]);
  const handleDownloadCsv = useCallback(
    (filename?: string) => {
      const content = buildCsv();
      const name = filename ?? `${toolbar?.filenameStem ?? "export"}.csv`;
      downloadCsv(name, content);
    },
    [buildCsv, toolbar?.filenameStem]
  );
  const handleExportPdf = useCallback(
    async (opts?: { title?: string; filename?: string }) => {
      const pdfOpts: { title?: string; filename?: string } = {};
      const title = opts?.title ?? toolbar?.pdfTitle;
      if (title !== undefined) pdfOpts.title = title;
      const filename =
        opts?.filename ?? `${toolbar?.filenameStem ?? "export"}.pdf`;
      pdfOpts.filename = filename;
      await exportToPdf(colsVisible, sorted, pdfOpts);
    },
    [colsVisible, sorted, toolbar?.pdfTitle, toolbar?.filenameStem]
  );

  useImperativeHandle(
    apiRef ?? { current: null },
    () => ({
      toCSV: () => buildCsv(),
      downloadCSV: (filename?: string) => handleDownloadCsv(filename),
      toPDF: (opts?: { title?: string; filename?: string }) => handleExportPdf(opts),
      getVisibleRows: () => sorted,
    }),
    [buildCsv, handleDownloadCsv, handleExportPdf, sorted]
  );

  const isEmpty = sorted.length === 0;
  const hasActiveFilters = filters.some((f) => {
    const v = f.value;
    if (v == null) return false;
    if (typeof v === "string") return v !== "";
    if (typeof v === "number") return Number.isFinite(v);
    if (typeof v === "boolean") return true;
    if (Array.isArray(v)) {
      if (v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string") {
        return v[0] !== "" || v[1] !== "";
      }
      return v.length > 0;
    }
    return false;
  });

  const defaultEmpty = (
    <EmptyState title={hasActiveFilters ? i18n.emptyFiltered : i18n.empty} />
  );

  const showCsv = toolbar?.showExport?.csv ?? false;
  const showPdf = toolbar?.showExport?.pdf ?? false;
  const showColumnsToggle = toolbar?.showColumnsToggle ?? false;

  const clearFilters = useCallback(() => {
    const cleared = filters.map((f) => {
      let v = f.value;
      if (f.kind === "text" || f.kind === "select") v = "";
      else if (f.kind === "multi-select") v = [];
      else if (f.kind === "boolean") v = null;
      else if (f.kind === "date-range") v = ["", ""] as const;
      return { ...f, value: v };
    });
    handleFiltersChange(cleared);
  }, [filters, handleFiltersChange]);

  return (
    <div className="flex flex-col gap-3">
      {filters.length > 0 ? (
        <div className="flex flex-col gap-2">
          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            i18nLabels={{ tutti: "Tutti", si: "Sì", no: "No" }}
          />
          {hasActiveFilters ? (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {i18n.clearFilters}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {toolbar || filters.length > 0 ? (
        <DataGridToolbar
          columns={columns}
          hiddenColumns={hiddenColumns}
          onToggleColumn={toggleColumn}
          showColumnsToggle={showColumnsToggle}
          showCsv={showCsv}
          showPdf={showPdf}
          onExportCsv={showCsv ? () => handleDownloadCsv() : undefined}
          onExportPdf={showPdf ? () => void handleExportPdf() : undefined}
          rowsVisible={sorted.length}
          rowsTotal={rows.length}
          i18n={i18n}
          extra={toolbar?.extra}
        />
      ) : null}
      <DataLoader
        loading={loading}
        error={error}
        empty={!loading && !error && isEmpty}
        emptyState={emptyState ?? defaultEmpty}
        {...(onRetry ? { onRetry } : {})}
      >
        {mode === "responsive" && card ? (
          <>
            <div className="hidden md:block -mx-1 overflow-x-auto px-1">
              <TableMode
                rows={sorted}
                columns={colsVisible}
                getRowId={getRowId}
                sort={sort}
                onToggleSort={toggleSort}
                {...(groupBy ? { groupBy } : {})}
                {...(expand ? { expand } : {})}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                {...(rowActions ? { rowActions } : {})}
                i18n={i18n}
                showFooter
                {...(caption !== undefined ? { caption } : {})}
              />
            </div>
            <div className="md:hidden">
              <CardsMode
                rows={sorted}
                getRowId={getRowId}
                card={card}
                rowActions={rowActions ?? []}
                {...(groupBy ? { groupBy } : {})}
                {...(cardsLayout ? { layout: cardsLayout } : {})}
              />
            </div>
          </>
        ) : mode === "cards" && card ? (
          <CardsMode
            rows={sorted}
            getRowId={getRowId}
            card={card}
            rowActions={rowActions ?? []}
            {...(groupBy ? { groupBy } : {})}
            {...(cardsLayout ? { layout: cardsLayout } : {})}
          />
        ) : mode === "virtual" && virtual ? (
          <VirtualMode
            rows={sorted}
            columns={colsVisible}
            getRowId={getRowId}
            rowHeight={virtual.rowHeight}
            height={virtual.height}
            sort={sort}
            onToggleSort={toggleSort}
            {...(rowActions ? { rowActions } : {})}
            i18n={i18n}
          />
        ) : (
          <TableMode
            rows={sorted}
            columns={colsVisible}
            getRowId={getRowId}
            sort={sort}
            onToggleSort={toggleSort}
            {...(groupBy ? { groupBy } : {})}
            {...(expand ? { expand } : {})}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            {...(rowActions ? { rowActions } : {})}
            i18n={i18n}
            showFooter
            {...(caption !== undefined ? { caption } : {})}
          />
        )}
      </DataLoader>
      {footerNote ? (
        <div className="text-xs text-(--color-text-muted)">{footerNote}</div>
      ) : null}
    </div>
  );
}
