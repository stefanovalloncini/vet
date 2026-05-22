import type { CSSProperties, ReactNode } from "react";
import { List, type RowComponentProps } from "react-window";

interface VirtualListProps<T> {
  items: readonly T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscanCount?: number;
  className?: string;
  emptyState?: ReactNode;
}

interface RowProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
}

function Row<T>({
  index,
  style,
  ariaAttributes,
  items,
  renderItem,
}: RowComponentProps<RowProps<T>>) {
  const item = items[index];
  if (item === undefined) return null;
  return (
    <div style={style} {...ariaAttributes}>
      {renderItem(item, index)}
    </div>
  );
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscanCount,
  className,
  emptyState,
}: VirtualListProps<T>) {
  if (items.length === 0) return <>{emptyState ?? null}</>;
  const style: CSSProperties = { height };
  return (
    <List
      className={className ?? ""}
      style={style}
      rowCount={items.length}
      rowHeight={itemHeight}
      overscanCount={overscanCount ?? 4}
      rowComponent={Row<T>}
      rowProps={{ items, renderItem }}
    />
  );
}
