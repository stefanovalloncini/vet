import type { CardRenderer, RowAction } from "../types";

interface CardsModeProps<T> {
  rows: ReadonlyArray<T>;
  getRowId: (row: T) => string;
  card: CardRenderer<T>;
  rowActions: ReadonlyArray<RowAction<T>>;
}

export function CardsMode<T>({ rows, getRowId, card, rowActions }: CardsModeProps<T>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
