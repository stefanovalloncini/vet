import { useCallback, useRef } from "react";
import type { FieldErrors, FieldValues, SubmitErrorHandler } from "react-hook-form";

/**
 * Returns a stable `onInvalid` callback for `form.handleSubmit(onValid, onInvalid)`
 * plus a ref to attach to the underlying `<form>` element. On validation failure,
 * the first invalid field inside that form is scrolled into view and focused.
 *
 * Respects `prefers-reduced-motion`: motion is set to `auto` instead of `smooth`
 * when the user prefers reduced motion.
 */
export function useFormScrollOnError<TValues extends FieldValues = FieldValues>(
  userOnInvalid?: SubmitErrorHandler<TValues>,
): {
  formRef: React.MutableRefObject<HTMLFormElement | null>;
  onInvalid: SubmitErrorHandler<TValues>;
} {
  const formRef = useRef<HTMLFormElement | null>(null);

  const onInvalid = useCallback<SubmitErrorHandler<TValues>>(
    (errors, event) => {
      try {
        focusFirstInvalid(formRef.current, errors);
      } catch {
        // Best-effort: never let scroll logic crash the submit flow.
      }
      if (userOnInvalid) userOnInvalid(errors, event);
    },
    [userOnInvalid],
  );

  return { formRef, onInvalid };
}

function focusFirstInvalid(
  form: HTMLFormElement | null,
  errors: FieldErrors,
): void {
  if (!form) return;
  const target = findFirstErrorElement(form, errors);
  if (!target) return;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // jsdom doesn't implement scrollIntoView; guard it.
  if (typeof target.scrollIntoView === "function") {
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }
  if (typeof target.focus === "function") {
    target.focus({ preventScroll: true });
  }
}

function findFirstErrorElement(
  form: HTMLFormElement,
  errors: FieldErrors,
): HTMLElement | null {
  // Prefer the first form control with aria-invalid=true. This catches all
  // primitives (TextField, Select, NumberField) which forward the prop.
  const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (invalid) return invalid;

  // Fallback: look up by name attribute using the first key in errors.
  const firstName = firstErrorName(errors);
  if (!firstName) return null;
  const byName = form.querySelector<HTMLElement>(
    `[name="${cssEscape(firstName)}"]`,
  );
  return byName;
}

function firstErrorName(errors: FieldErrors): string | null {
  for (const key of Object.keys(errors)) {
    if (errors[key]) return key;
  }
  return null;
}

function cssEscape(value: string): string {
  if (typeof window !== "undefined" && typeof window.CSS?.escape === "function") {
    return window.CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}
