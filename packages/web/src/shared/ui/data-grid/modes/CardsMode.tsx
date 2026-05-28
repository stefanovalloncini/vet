import type { CardRenderer, CardsLayout, GroupingDef, RowAction } from "../types";
import { groupRows } from "../engine";

interface CardsModeProps<T> {
  rows: ReadonlyArray<T>;
  getRowId: (row: T) => string;
  card: CardRenderer<T>;
  rowActions: ReadonlyArray<RowAction<T>>;
  groupBy?: GroupingDef<T>;
  layout?: CardsLayout;
}

const LAYOUT_CLASSES: Record<CardsLayout, string> = {
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
  list: "flex flex-col gap-2.5",
};

function CardGrid<T>({
  rows,
  getRowId,
  card,
  rowActions,
  layout = "grid",
}: Pick<CardsModeProps<T>, "rows" | "getRowId" | "card" | "rowActions" | "layout">) {
  return (
    <div className={LAYOUT_CLASSES[layout]}>
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
  layout = "grid",
}: CardsModeProps<T>) {
  if (!groupBy) {
    return (
      <CardGrid
        rows={rows}
        getRowId={getRowId}
        card={card}
        rowActions={rowActions}
        layout={layout}
      />
    );
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
            layout={layout}
          />
        </section>
      ))}
    </div>
  );
}
