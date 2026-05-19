interface BrandProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const wordmarkSize = {
  sm: "text-[13px]",
  md: "text-sm",
  lg: "text-base",
};

const markSize = {
  sm: 18,
  md: 22,
  lg: 28,
};

const gapSize = {
  sm: "gap-1.5",
  md: "gap-2",
  lg: "gap-2.5",
};

export function Brand({ size = "md", className = "" }: BrandProps) {
  const s = markSize[size];
  return (
    <span
      className={`inline-flex items-center ${gapSize[size]} font-semibold uppercase tracking-[0.14em] text-(--color-text) ${wordmarkSize[size]} ${className}`}
    >
      <BrandMark size={s} />
      <span>Veterinario</span>
    </span>
  );
}

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 24, className = "" }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label="Veterinario logo"
      className={className}
    >
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="6.5"
        className="fill-(--color-accent)"
      />
      <path
        d="M7 8.5 L12 16.5 L17 8.5"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="6.5" r="1.1" fill="white" opacity="0.75" />
    </svg>
  );
}
