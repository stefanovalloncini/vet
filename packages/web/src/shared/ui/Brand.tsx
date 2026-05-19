interface BrandProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { dot: "w-1.5 h-1.5", name: "text-base" },
  md: { dot: "w-2 h-2", name: "text-xl" },
  lg: { dot: "w-2.5 h-2.5", name: "text-3xl" },
};

export function Brand({ size = "md", className = "" }: BrandProps) {
  const s = sizeMap[size];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className={`${s.dot} rounded-full bg-(--color-accent) flex-shrink-0`}
      />
      <span
        className={`font-serif ${s.name} text-(--color-text) tracking-tight leading-none`}
      >
        Veterinario
      </span>
    </span>
  );
}
