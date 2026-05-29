import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium will-change-transform transition-[background-color,color,border-color,transform,opacity,box-shadow] duration-(--motion-fast) ease-(--ease-out-quart) active:scale-[0.97] active:duration-(--motion-press) focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary:
    "bg-(--color-accent) text-white hover:bg-(--color-accent-hover) focus-visible:ring-(--color-accent)",
  secondary:
    "bg-(--color-surface) border border-(--color-border) text-(--color-text) hover:border-(--color-border-strong) hover:bg-(--color-surface-muted) focus-visible:ring-(--color-accent)",
  ghost:
    "text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface-muted) focus-visible:ring-(--color-accent)",
  danger:
    "bg-(--color-danger) text-white hover:opacity-90 focus-visible:ring-(--color-danger)",
};

const sizes: Record<Size, string> = {
  lg: "h-13 px-5 text-base rounded-md",
  md: "h-11 px-4 text-sm rounded-md",
  sm: "h-9 px-3 text-xs rounded-md",
};

export function Button({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    base,
    variants[variant],
    sizes[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...rest} className={cls}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
