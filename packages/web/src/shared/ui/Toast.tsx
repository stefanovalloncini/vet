import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { registerMutationErrorNotifier } from "../data/queryClient";

type ToastKind = "info" | "success" | "error";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface NotifyOptions {
  kind?: ToastKind;
  action?: ToastAction;
  duration?: number;
  persistent?: boolean;
}

interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
  action?: ToastAction;
}

interface ToastApi {
  notify: (text: string, kindOrOpts?: ToastKind | NotifyOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 3500;
const ACTION_DURATION = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const notify = useCallback<ToastApi["notify"]>((text, kindOrOpts) => {
    const opts: NotifyOptions =
      typeof kindOrOpts === "string"
        ? { kind: kindOrOpts }
        : kindOrOpts ?? {};
    const kind: ToastKind = opts.kind ?? "info";
    const id = Date.now() + Math.random();
    const item: ToastItem = opts.action
      ? { id, kind, text, action: opts.action }
      : { id, kind, text };
    setToasts((prev) => [...prev, item]);
    if (opts.persistent) return;
    const duration =
      opts.duration ?? (opts.action ? ACTION_DURATION : DEFAULT_DURATION);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);
  useEffect(() => {
    registerMutationErrorNotifier((text, kind) => notify(text, kind));
    return () => registerMutationErrorNotifier(null);
  }, [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-5 z-50 flex flex-col items-end gap-2 print:hidden bottom-[calc(var(--fab-bottom)+4rem)] sm:bottom-20"
        aria-live="polite"
        aria-atomic
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "flex items-center gap-3 pl-4 pr-2 py-2 rounded-xl shadow-lg text-sm border max-w-xs animate-toast-in",
              t.kind === "success"
                ? "bg-(--color-accent-soft) text-(--color-text) border-(--color-accent)/30"
                : t.kind === "error"
                ? "bg-(--color-danger)/10 text-(--color-danger) border-(--color-danger)/30"
                : "bg-(--color-surface) text-(--color-text) border-(--color-border)",
            ].join(" ")}
            role="status"
          >
            <span>{t.text}</span>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
                className="px-2 py-1 rounded-md text-xs font-medium text-(--color-accent) hover:bg-(--color-accent)/10"
              >
                {t.action.label}
              </button>
            ) : null}
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
