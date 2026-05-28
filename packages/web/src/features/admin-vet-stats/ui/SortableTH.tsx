import { ArrowDown, ArrowUp } from "lucide-react";

export type SortKey = "nome" | "count" | "total" | "lastActivity";
export type SortDir = "asc" | "desc";

interface SortableTHProps {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onToggle: (key: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}

export function SortableTH({
  label,
  sortKey,
  activeKey,
  dir,
  onToggle,
  align = "left",
  className = "",
}: SortableTHProps) {
  const active = activeKey === sortKey;
  const ariaSort: "ascending" | "descending" | "none" = active
    ? dir === "asc"
      ? "ascending"
      : "descending"
    : "none";
  const thAlign = align === "right" ? "text-right" : "text-left";
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-4 py-2.5 ${thAlign} font-normal ${className}`}
    >
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        className={[
          "inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium rounded-sm transition-colors duration-(--motion-fast) ease-(--ease-out-quart)",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1",
          active
            ? "text-(--color-text)"
            : "text-(--color-text-muted) hover:text-(--color-text)",
          align === "right" ? "justify-end w-full" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="inline-flex w-3 h-3 items-center">
          {active ? (
            dir === "asc" ? (
              <ArrowUp size={12} strokeWidth={1.75} />
            ) : (
              <ArrowDown size={12} strokeWidth={1.75} />
            )
          ) : null}
        </span>
      </button>
    </th>
  );
}
