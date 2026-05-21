import { Card } from "../../../shared/ui";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: number | null;
  secondary?: string;
  accent?: "danger" | "ok";
  compactValue?: boolean;
}

export function MetricCard({
  label,
  value,
  trend,
  secondary,
  accent,
  compactValue,
}: MetricCardProps) {
  const valueColor =
    accent === "danger" ? "text-(--color-danger)" : "text-(--color-text)";
  const trendLine =
    trend !== null && trend !== undefined
      ? {
          text: `${trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} ${Math.abs(trend)}% vs mese prec.`,
          color:
            trend > 0
              ? "text-(--color-success)"
              : trend < 0
                ? "text-(--color-danger)"
                : "text-(--color-text-subtle)",
        }
      : null;
  const secondaryLine = secondary
    ? { text: secondary, color: "text-(--color-text-muted)" }
    : trendLine;

  return (
    <Card
      className={[
        "h-full flex flex-col min-h-[112px]",
        accent === "danger" ? "border-(--color-danger)/30" : "",
      ].join(" ")}
    >
      <p className="text-[10px] uppercase tracking-[0.06em] text-(--color-text-muted) truncate">
        {label}
      </p>
      <div className="mt-auto pt-3">
        <p
          className={[
            "tabular-nums font-medium truncate",
            compactValue ? "text-base sm:text-lg" : "text-xl sm:text-2xl",
            valueColor,
          ].join(" ")}
        >
          {value}
        </p>
        <p
          className={[
            "text-[11px] mt-0.5 tabular-nums truncate min-h-[14px]",
            secondaryLine ? secondaryLine.color : "text-(--color-text-subtle)",
          ].join(" ")}
        >
          {secondaryLine ? secondaryLine.text : " "}
        </p>
      </div>
    </Card>
  );
}
