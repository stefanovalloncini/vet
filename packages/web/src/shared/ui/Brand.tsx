interface BrandProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "text-[13px]",
  md: "text-sm",
  lg: "text-base",
};

export function Brand({ size = "md", className = "" }: BrandProps) {
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-[0.14em] text-(--color-text) ${sizeMap[size]} ${className}`}
    >
      Veterinario
    </span>
  );
}
