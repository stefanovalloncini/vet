import type { InputHTMLAttributes } from "react";
import { useController, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { TextField } from "../TextField";

interface RHFTextFieldProps<TFieldValues extends FieldValues>
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue"> {
  name: Path<TFieldValues>;
  label: string;
  hint?: string;
  idPrefix?: string;
}

export function RHFTextField<TFieldValues extends FieldValues>({
  name,
  label,
  hint,
  idPrefix,
  ...rest
}: RHFTextFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({ name, control });
  const id = idPrefix ? `${idPrefix}-${name}` : name;
  return (
    <TextField
      {...rest}
      id={id}
      label={label}
      hint={hint}
      name={field.name}
      value={(field.value as string | number | undefined) ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
      error={fieldState.error?.message}
    />
  );
}
