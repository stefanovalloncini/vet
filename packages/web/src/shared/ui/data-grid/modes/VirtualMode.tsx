import type { ReactNode } from "react";
import { VirtualList } from "../../VirtualList";
import type { Column, DataGridI18n, RowAction, SortState } from "../types";

interface VirtualModeProps<T> {
  rows: ReadonlyArray<T>;
  columns: ReadonlyArray<Column<T>>;
  getRowId: (row: T) => string;
  rowHeight: number;
  height: number;
  sort: SortState | null;
  onToggleSort: (columnId: string) => void;
  rowActions?: ReadonlyArray<RowAction<T>>;
  i18n: DataGridI18n;
}

function alignClass(a: Column<unknown>["align"]): string {
  switch (a) {
    case "end":
      return "text-right";
    case "center":
      return "text-center";
    default:
      return "text-left";
  }
}

function formatCellValue(v: unknown): ReactNode {
  if (v == null) return null;
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${d}/${m}/${y}`;
  }
  if (typeof v === "number") return v.toLocaleString("it-IT");
  if (typeof v === "boolean") return v ? "✓" : "—";
  if (typeof v === "string") return v;
  if (typeof v === "object") return null;
  return String(v);
}

export function VirtualMode<T>({
  rows,
  columns,
  getRowId,
  rowHeight,
  height,
  sort,
  onToggleSort,
  rowActions,
  i18n,
}: VirtualModeProps<T>) {
  const hasActions = (rowActions?.length ?? 0) > 0;

  function sortIndicator(colId: string): string {
    if (!sort || sort.columnId !== colId) return "";
    return sort.direction === "asc" ? " ↑" : " ↓";
  }

  return (
    <div className="w-full">
      <div
        role="row"
        className="flex items-center border-b border-(--color-border) text-xs uppercase tracking-wider text-(--color-text-muted)"
        style={{ height: rowHeight }}
      >
        {columns.map((col) => {
          const isSortable = col.sortable !== false;
          const ariaLabel =
            sort?.columnId === col.id && sort.direction === "asc"
              ? i18n.sortDesc
              : i18n.sortAsc;
          return (
            <div
              key={col.id}
              role="columnheader"
              className={[
                "flex-1 px-3 py-2 font-medium",
                alignClass(col.align as Column<unknown>["align"]),
              ].join(" ")}
              style={col.width !== undefined ? { width: col.width, flex: "none" } : undefined}
            >
              {isSortable ? (
                <button
                  type="button"
                  onClick={() => onToggleSort(col.id)}
                  aria-label={ariaLabel}
                  className="inline-flex items-center gap-1 hover:text-(--color-text) transition-colors"
                >
                  {col.header}
                  <span aria-hidden="true">{sortIndicator(col.id)}</span>
                </button>
              ) : (
                col.header
              )}
            </div>
          );
        })}
        {hasActions ? <div className="w-24" /> : null}
      </div>
      <VirtualList
        items={rows}
        itemHeight={rowHeight}
        height={height}
        renderItem={(row, index) => (
          <div
            key={getRowId(row)}
            role="row"
            className="flex items-center border-b border-(--color-border)/60 hover:bg-(--color-surface-muted) transition-colors h-full"
          >
            {columns.map((col) => {
              const content: ReactNode = col.cell
                ? col.cell(row, index)
                : formatCellValue(col.accessor(row));
              return (
                <div
                  key={col.id}
                  role="cell"
                  className={[
                    "flex-1 px-3 py-2 text-sm text-(--color-text) truncate",
                    alignClass(col.align as Column<unknown>["align"]),
                  ].join(" ")}
                  style={
                    col.width !== undefined
                      ? { width: col.width, flex: "none" }
                      : undefined
                  }
                >
                  {content}
                </div>
              );
            })}
            {hasActions ? (
              <div className="w-24 px-3 text-right">
                {(rowActions ?? [])
                  .filter((a) => (a.visible ? a.visible(row) : true))
                  .map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => a.onClick(row)}
                      disabled={a.disabled ? a.disabled(row) : false}
                      className="text-xs ml-2 first:ml-0 text-(--color-text-muted) hover:text-(--color-text) disabled:opacity-50"
                    >
                      {a.label}
                    </button>
                  ))}
              </div>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}
