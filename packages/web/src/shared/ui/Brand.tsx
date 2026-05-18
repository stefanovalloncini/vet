interface BrandProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "text-xs tracking-[0.2em]",
  md: "text-sm tracking-[0.25em]",
  lg: "text-base tracking-[0.3em]",
};

export function Brand({ size = "md", className = "" }: BrandProps) {
  return (
    <p
      className={`uppercase font-medium text-(--color-text-muted) ${sizeMap[size]} ${className}`}
    >
      Vet
    </p>
  );
}
