import { forwardRef, type InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({
  id,
  label,
  error,
  hint,
  className = "",
  ...rest
}, ref) {
  const isDateLike = rest.type === "date" || rest.type === "datetime-local" || rest.type === "time" || rest.type === "month" || rest.type === "week";
  const inputCls = [
    "block w-full min-w-0 box-border h-11 rounded-lg border bg-(--color-surface) px-3.5 text-sm text-(--color-text)",
    "placeholder:text-(--color-text-subtle)",
    "focus:outline-none disabled:opacity-50",
    "transition-[border-color] duration-(--motion-fast) ease-(--ease-out-quart)",
    isDateLike ? "appearance-none [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:min-h-[1.25rem]" : "",
    error
      ? "border-(--color-danger) focus:border-(--color-danger)"
      : "border-(--color-border) hover:border-(--color-border-strong) focus:border-(--color-accent)",
    className,
  ].join(" ");

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs uppercase tracking-wider font-medium text-(--color-text-muted) mb-2"
      >
        {label}
      </label>
      <input ref={ref} id={id} {...rest} className={inputCls} />
      {error ? (
        <p className="mt-2 text-xs text-(--color-danger)" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-xs text-(--color-text-subtle)">{hint}</p>
      ) : null}
    </div>
  );
});
