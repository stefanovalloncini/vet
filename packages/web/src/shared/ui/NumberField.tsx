import { forwardRef, useCallback, type InputHTMLAttributes } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "min" | "max" | "step"
>;

interface NumberFieldProps extends NativeProps {
  id: string;
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  step?: number;
  min?: number;
  max?: number;
  error?: string | undefined;
  hint?: string | undefined;
  suffix?: string;
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { id, label, value, onChange, step = 10, min, max, error, hint, suffix, disabled, className = "", ...rest },
  ref
) {
  const current = typeof value === "number" ? value : Number.NaN;
  const bump = useCallback(
    (dir: 1 | -1) => {
      const base = Number.isFinite(current) ? current : typeof min === "number" ? min : 0;
      const next = base + dir * step;
      const decimals = decimalsOf(step);
      let rounded = Number(next.toFixed(decimals));
      if (typeof min === "number" && rounded < min) rounded = min;
      if (typeof max === "number" && rounded > max) rounded = max;
      onChange(rounded);
    },
    [current, step, min, max, onChange]
  );
  const atMin = typeof min === "number" && Number.isFinite(current) && current <= min;
  const atMax = typeof max === "number" && Number.isFinite(current) && current >= max;

  return (
    <div>
      <label htmlFor={id} className="block text-xs uppercase tracking-wider font-medium text-(--color-text-muted) mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          ref={ref}
          id={id}
          type="number"
          inputMode="decimal"
          value={value === "" ? "" : value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") return onChange("");
            const parsed = Number(v.replace(",", "."));
            onChange(Number.isFinite(parsed) ? parsed : "");
          }}
          step="any"
          {...(typeof min === "number" ? { min } : {})}
          {...(typeof max === "number" ? { max } : {})}
          disabled={disabled}
          className={inputCls(!!error, className)}
        />
        {suffix ? <span className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 text-xs text-(--color-text-subtle)">{suffix}</span> : null}
        <Stepper onUp={() => bump(1)} onDown={() => bump(-1)} upDisabled={!!disabled || atMax} downDisabled={!!disabled || atMin} />
      </div>
      {error ? <p className="mt-2 text-xs text-(--color-danger)" role="alert">{error}</p>
        : hint ? <p className="mt-2 text-xs text-(--color-text-subtle)">{hint}</p>
        : null}
    </div>
  );
});

const stepBtn = "flex h-1/2 w-9 items-center justify-center text-(--color-text-muted) hover:text-(--color-accent) hover:bg-(--color-accent-soft) disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-(--color-text-muted) focus:outline-none focus-visible:bg-(--color-accent-soft) focus-visible:text-(--color-accent) transition-colors duration-(--motion-fast) ease-(--ease-out-quart)";

function Stepper({ onUp, onDown, upDisabled, downDisabled }: { onUp: () => void; onDown: () => void; upDisabled: boolean; downDisabled: boolean }) {
  return (
    <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-(--color-border)">
      <button type="button" aria-label="Aumenta" onClick={onUp} disabled={upDisabled} className={`${stepBtn} rounded-tr-lg border-b border-(--color-border)`}>
        <ChevronUp size={14} strokeWidth={2.25} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Diminuisci" onClick={onDown} disabled={downDisabled} className={`${stepBtn} rounded-br-lg`}>
        <ChevronDown size={14} strokeWidth={2.25} aria-hidden="true" />
      </button>
    </div>
  );
}

function decimalsOf(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  const s = step.toString();
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

function inputCls(hasError: boolean, extra: string): string {
  return [
    "block w-full min-w-0 box-border h-11 rounded-lg border bg-(--color-surface) pl-3.5 pr-20 text-sm text-(--color-text)",
    "placeholder:text-(--color-text-subtle) disabled:opacity-50 focus:outline-none tabular-nums",
    "transition-[border-color] duration-(--motion-fast) ease-(--ease-out-quart)",
    hasError ? "border-(--color-danger) focus:border-(--color-danger)" : "border-(--color-border) hover:border-(--color-border-strong) focus:border-(--color-accent)",
    extra,
  ].join(" ");
}
