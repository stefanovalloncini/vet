import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../Button";
import type { Column, DataGridI18n } from "./types";

interface DataGridToolbarProps<T> {
  columns: ReadonlyArray<Column<T>>;
  hiddenColumns: ReadonlySet<string>;
  onToggleColumn: (id: string) => void;
  showColumnsToggle: boolean;
  showCsv: boolean;
  onExportCsv?: (() => void) | undefined;
  rowsVisible: number;
  rowsTotal: number;
  i18n: DataGridI18n;
  extra?: ReactNode | undefined;
}

export function DataGridToolbar<T>({
  columns,
  hiddenColumns,
  onToggleColumn,
  showColumnsToggle,
  showCsv,
  onExportCsv,
  rowsVisible,
  rowsTotal,
  i18n,
  extra,
}: DataGridToolbarProps<T>) {
  const [columnsOpen, setColumnsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!columnsOpen) return;
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [columnsOpen]);

  return (
    <div className="flex flex-wrap items-center gap-3 justify-between">
      <div className="text-xs text-(--color-text-muted) tabular-nums" data-testid="datagrid-row-counter">
        {i18n.rowsOf(rowsVisible, rowsTotal)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {extra}
        {showColumnsToggle ? (
          <div className="relative" ref={popoverRef}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setColumnsOpen((p) => !p)}
              aria-haspopup="menu"
              aria-expanded={columnsOpen}
            >
              {i18n.columns}
            </Button>
            {columnsOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 min-w-[14rem] rounded-lg border border-(--color-border) bg-(--color-surface) p-2 shadow-[var(--shadow-soft)] z-20"
              >
                {columns.map((c) => {
                  const hidden = hiddenColumns.has(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-(--color-text) hover:bg-(--color-surface-muted) rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!hidden}
                        onChange={() => onToggleColumn(c.id)}
                        className="accent-(--color-accent)"
                      />
                      <span>{c.header}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
        {showCsv && onExportCsv ? (
          <Button variant="secondary" size="sm" onClick={onExportCsv}>
            {i18n.exportCsv}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
