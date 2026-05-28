interface ChartEmptyProps {
  label?: string;
}

export function ChartEmpty({ label = "Nessun dato per il periodo." }: ChartEmptyProps) {
  return (
    <p className="py-6 text-sm text-(--color-text-subtle)">{label}</p>
  );
}
