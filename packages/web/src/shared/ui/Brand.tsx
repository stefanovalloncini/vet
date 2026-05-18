interface BrandProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showTagline?: boolean;
}

const sizeMap = {
  sm: { dot: "w-1.5 h-1.5", name: "text-base", tag: "text-[10px]" },
  md: { dot: "w-2 h-2", name: "text-xl", tag: "text-xs" },
  lg: { dot: "w-2.5 h-2.5", name: "text-3xl", tag: "text-sm" },
};

export function Brand({
  size = "md",
  className = "",
  showTagline = false,
}: BrandProps) {
  const s = sizeMap[size];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className={`${s.dot} rounded-full bg-(--color-accent) flex-shrink-0`}
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif ${s.name} text-(--color-text) tracking-tight`}
        >
          Marinoni
        </span>
        {showTagline ? (
          <span
            className={`${s.tag} text-(--color-text-subtle) uppercase tracking-[0.18em] mt-1`}
          >
            Studio veterinario
          </span>
        ) : null}
      </span>
    </span>
  );
}
