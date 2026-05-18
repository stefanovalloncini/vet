import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "info" | "success" | "error";
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastApi {
  notify: (text: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const notify = useCallback((text: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-20 sm:bottom-5 right-5 z-50 flex flex-col items-end gap-2 print:hidden"
        aria-live="polite"
        aria-atomic
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "px-4 py-2 rounded-xl shadow-lg text-sm border max-w-xs animate-[fadeIn_0.15s_ease-out]",
              t.kind === "success"
                ? "bg-(--color-accent-soft) text-(--color-text) border-(--color-accent)/30"
                : t.kind === "error"
                ? "bg-(--color-danger)/10 text-(--color-danger) border-(--color-danger)/30"
                : "bg-(--color-surface) text-(--color-text) border-(--color-border)",
            ].join(" ")}
            role="status"
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { notify: () => undefined };
  }
  return ctx;
}
