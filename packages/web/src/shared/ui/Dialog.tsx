import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  describedBy?: string;
  size?: "sm" | "md" | "lg";
  sheet?: boolean;
  children: ReactNode;
  className?: string;
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onClose,
  labelledBy,
  describedBy,
  size = "md",
  sheet = true,
  children,
  className = "",
}: DialogProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const surface = surfaceRef.current;
    if (surface) {
      const first = surface.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? surface).focus({ preventScroll: true });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && surface) trapTab(e, surface);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prevFocusRef.current?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;

  const layout = sheet
    ? "items-end sm:items-center justify-center p-0 sm:p-8"
    : "items-start sm:items-center justify-center p-4 sm:p-8";
  const surfaceShape = sheet
    ? `w-full sm:w-auto sm:min-w-0 ${sizeMap[size]} rounded-t-2xl sm:rounded-2xl`
    : `w-full min-w-0 ${sizeMap[size]} rounded-2xl`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={`fixed inset-0 z-40 flex ${layout} bg-(--color-overlay) animate-fade-in-soft`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={surfaceRef}
        tabIndex={-1}
        className={`${surfaceShape} bg-(--color-surface) border border-(--color-border) shadow-[var(--shadow-popover)] animate-scale-in overflow-hidden focus:outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

function trapTab(e: KeyboardEvent, surface: HTMLElement) {
  const nodes = Array.from(surface.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => !n.hasAttribute("disabled"));
  if (nodes.length === 0) {
    e.preventDefault();
    surface.focus();
    return;
  }
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (!first || !last) return;
  const active = document.activeElement as HTMLElement | null;
  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}
