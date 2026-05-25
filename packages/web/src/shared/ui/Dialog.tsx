import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  describedBy?: string;
  size?: "sm" | "md" | "lg";
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

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-8 bg-(--color-overlay) animate-fade-in-soft"
      onPointerDown={(e) => {
        e.currentTarget.dataset["downTarget"] = e.target === e.currentTarget ? "self" : "child";
      }}
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          e.currentTarget.dataset["downTarget"] === "self"
        ) {
          onClose();
        }
        delete e.currentTarget.dataset["downTarget"];
      }}
    >
      <div
        ref={surfaceRef}
        tabIndex={-1}
        className={`w-full min-w-0 ${sizeMap[size]} max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] rounded-2xl bg-(--color-surface) border border-(--color-border) shadow-[var(--shadow-popover)] animate-scale-in overflow-y-auto overscroll-contain focus:outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
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
