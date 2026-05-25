import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({
  id,
  label,
  error,
  hint,
  className = "",
  ...rest
}, ref) {
  const cls = [
    "w-full rounded-xl border bg-(--color-surface) px-4 py-3 text-sm text-(--color-text)",
    "placeholder:text-(--color-text-subtle) min-h-[3rem] resize-y",
    "focus:outline-none focus:ring-2 disabled:opacity-50",
    error
      ? "border-(--color-danger) focus:border-(--color-danger) focus:ring-(--color-danger)/20"
      : "border-(--color-border) focus:border-(--color-accent) focus:ring-(--color-accent)/20",
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
      <textarea ref={ref} id={id} {...rest} className={cls} />
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
