import type { CardRenderer, GroupingDef, RowAction } from "../types";
import { groupRows } from "../engine";

interface CardsModeProps<T> {
  rows: ReadonlyArray<T>;
  getRowId: (row: T) => string;
  card: CardRenderer<T>;
  rowActions: ReadonlyArray<RowAction<T>>;
  groupBy?: GroupingDef<T>;
}

const GRID_CLASSES = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3";

function CardGrid<T>({
  rows,
  getRowId,
  card,
  rowActions,
}: Pick<CardsModeProps<T>, "rows" | "getRowId" | "card" | "rowActions">) {
  return (
    <div className={GRID_CLASSES}>
      {rows.map((row) => {
        const visible = rowActions.filter((a) => (a.visible ? a.visible(row) : true));
        return (
          <div key={getRowId(row)} className="contents">
            {card(row, { actions: visible })}
          </div>
        );
      })}
    </div>
  );
}

export function CardsMode<T>({
  rows,
  getRowId,
  card,
  rowActions,
  groupBy,
}: CardsModeProps<T>) {
  if (!groupBy) {
    return <CardGrid rows={rows} getRowId={getRowId} card={card} rowActions={rowActions} />;
  }

  const buckets = groupRows(rows, groupBy);

  return (
    <div className="flex flex-col gap-6">
      {buckets.map((bucket) => (
        <section key={bucket.key}>
          <header className="flex items-baseline justify-between gap-3 mb-2 pb-1.5 border-b border-(--color-border)">
            <h2 className="text-sm font-semibold text-(--color-text)">
              {groupBy.labelOf(bucket.key, bucket.rows)}
            </h2>
            {groupBy.summary ? (
              <span className="text-sm font-semibold text-(--color-text) tabular-nums">
                {groupBy.summary(bucket.rows)}
              </span>
            ) : null}
          </header>
          <CardGrid
            rows={bucket.rows}
            getRowId={getRowId}
            card={card}
            rowActions={rowActions}
          />
        </section>
      ))}
    </div>
  );
}
