import { Fragment, type ReactNode } from "react";
import type {
  Column,
  DataGridI18n,
  ExpandDef,
  GroupingDef,
  RowAction,
  SortState,
} from "../types";
import { groupRows } from "../engine";

interface TableModeProps<T> {
  rows: ReadonlyArray<T>;
  columns: ReadonlyArray<Column<T>>;
  getRowId: (row: T) => string;
  sort: SortState | null;
  onToggleSort: (columnId: string) => void;
  groupBy?: GroupingDef<T>;
  expand?: ExpandDef<T>;
  expandedIds?: ReadonlySet<string>;
  onToggleExpand?: (id: string) => void;
  rowActions?: ReadonlyArray<RowAction<T>>;
  i18n: DataGridI18n;
  showFooter?: boolean;
  caption?: string;
}

function cx(...parts: ReadonlyArray<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
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

function rowActionToneClass(tone: RowAction<unknown>["tone"]): string {
  switch (tone) {
    case "primary":
      return "text-(--color-accent) hover:underline";
    case "danger":
      return "text-(--color-danger) hover:underline";
    default:
      return "text-(--color-text-muted) hover:text-(--color-text)";
  }
}

export function TableMode<T>({
  rows,
  columns,
  getRowId,
  sort,
  onToggleSort,
  groupBy,
  expand,
  expandedIds,
  onToggleExpand,
  rowActions,
  i18n,
  showFooter,
  caption,
}: TableModeProps<T>) {
  const buckets = groupRows(rows, groupBy);
  const hasActions = (rowActions?.length ?? 0) > 0;
  const totalCols = columns.length + (expand ? 1 : 0) + (hasActions ? 1 : 0);

  function renderRow(row: T, index: number): ReactNode {
    const id = getRowId(row);
    const expanded = expandedIds?.has(id) ?? false;
    return (
      <Fragment key={id}>
        <tr className="border-b border-(--color-border)/60 last:border-b-0 hover:bg-(--color-surface-muted) transition-colors">
          {expand ? (
            <td className="py-2.5 pr-2 align-top w-8">
              <button
                type="button"
                onClick={() => onToggleExpand?.(id)}
                aria-expanded={expanded}
                aria-label={expanded ? "−" : "+"}
                className="h-6 w-6 inline-flex items-center justify-center rounded text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface-muted)"
              >
                {expanded ? "−" : "+"}
              </button>
            </td>
          ) : null}
          {columns.map((col) => {
            const content: ReactNode = col.cell
              ? col.cell(row, index)
              : formatCellValue(col.accessor(row));
            return (
              <td
                key={col.id}
                className={cx(
                  "py-2.5 pr-3 align-top",
                  col.tone === "muted" ? "text-(--color-text-muted)" : "text-(--color-text)",
                  alignClass(col.align as Column<unknown>["align"]),
                  col.align === "end" ? "tabular-nums" : false,
                  col.cellClassName
                )}
                style={col.width !== undefined ? { width: col.width } : undefined}
              >
                {content}
              </td>
            );
          })}
          {hasActions ? (
            <td className="py-2.5 pr-3 align-top text-right whitespace-nowrap">
              {(rowActions ?? [])
                .filter((a) => (a.visible ? a.visible(row) : true))
                .map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => a.onClick(row)}
                    disabled={a.disabled ? a.disabled(row) : false}
                    className={[
                      "text-xs ml-2 first:ml-0 inline-flex items-center gap-1 disabled:opacity-50",
                      rowActionToneClass(a.tone as RowAction<unknown>["tone"]),
                    ].join(" ")}
                  >
                    {a.icon}
                    {a.label}
                  </button>
                ))}
            </td>
          ) : null}
        </tr>
        {expand && expanded ? (
          <tr className="bg-(--color-surface-muted)/50">
            <td colSpan={totalCols} className="px-4 py-3">
              {expand.render(row)}
            </td>
          </tr>
        ) : null}
      </Fragment>
    );
  }

  function sortIndicator(colId: string): string {
    if (!sort || sort.columnId !== colId) return "";
    return sort.direction === "asc" ? " ↑" : " ↓";
  }

  return (
    <table className="w-full text-[13px] border-collapse">
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <thead>
        <tr className="text-left text-xs uppercase tracking-wider text-(--color-text) border-b border-(--color-border-strong)">
          {expand ? <th className="py-2 pr-2 font-medium w-8" /> : null}
          {columns.map((col) => {
            const isSortable = col.sortable !== false;
            const ariaLabel =
              sort?.columnId === col.id && sort.direction === "asc"
                ? i18n.sortDesc
                : i18n.sortAsc;
            return (
              <th
                key={col.id}
                scope="col"
                className={cx(
                  "py-2 pr-3 font-medium",
                  alignClass(col.align as Column<unknown>["align"]),
                  col.headerClassName
                )}
                style={col.width !== undefined ? { width: col.width } : undefined}
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
              </th>
            );
          })}
          {hasActions ? <th className="py-2 font-medium w-1" /> : null}
        </tr>
      </thead>
      {groupBy ? (
        buckets.map((bucket) => (
          <tbody key={bucket.key} className="border-b border-(--color-border) last:border-b-0">
            <tr>
              <td
                colSpan={totalCols}
                className="pt-5 pb-2 text-sm font-semibold text-(--color-text)"
              >
                {groupBy.labelOf(bucket.key, bucket.rows)}
                {groupBy.summary ? (
                  <span className="ml-3 font-normal text-(--color-text-muted)">
                    {groupBy.summary(bucket.rows)}
                  </span>
                ) : null}
              </td>
            </tr>
            {bucket.rows.map((row, idx) => renderRow(row, idx))}
          </tbody>
        ))
      ) : (
        <tbody>{rows.map((row, idx) => renderRow(row, idx))}</tbody>
      )}
      {showFooter && columns.some((c) => c.footer) ? (
        <tfoot>
          <tr className="border-t border-(--color-border) text-(--color-text) font-medium">
            {expand ? <td /> : null}
            {columns.map((col) => (
              <td
                key={col.id}
                className={[
                  "py-2.5 pr-3",
                  alignClass(col.align as Column<unknown>["align"]),
                ].join(" ")}
              >
                {col.footer ? col.footer(rows) : null}
              </td>
            ))}
            {hasActions ? <td /> : null}
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
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
