import type { ReactNode } from "react";
import { useFormContext, useFormState } from "react-hook-form";
import { Button } from "../Button";
import { Spinner } from "../Spinner";

interface SubmitButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  /** Override busy state. Default: reads from useFormState().isSubmitting */
  busy?: boolean;
  /** When form has no changes since reset, disable. Default true. */
  disableWhenPristine?: boolean;
}

export function SubmitButton({
  children,
  variant = "primary",
  size,
  fullWidth,
  busy,
  disableWhenPristine = true,
}: SubmitButtonProps) {
  const { control } = useFormContext();
  const { isSubmitting, isDirty } = useFormState({ control });

  const isBusy = busy ?? isSubmitting;
  const disabled = isBusy || (disableWhenPristine && !isDirty);

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={disabled}
      {...(size !== undefined ? { size } : {})}
      {...(fullWidth !== undefined ? { fullWidth } : {})}
      {...(isBusy ? { leadingIcon: <Spinner size={16} /> } : {})}
    >
      {children}
    </Button>
  );
}
