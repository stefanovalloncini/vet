import type { ReactNode, SelectHTMLAttributes } from "react";
import { useController, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { Select } from "../Select";

interface SelectOption {
  value: string;
  label: string;
}

interface RHFSelectProps<TFieldValues extends FieldValues>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "defaultValue"> {
  name: Path<TFieldValues>;
  label: string;
  options: ReadonlyArray<SelectOption>;
  hint?: string;
  action?: ReactNode;
}

export function RHFSelect<TFieldValues extends FieldValues>({
  name,
  label,
  options,
  hint,
  action,
  ...rest
}: RHFSelectProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({ name, control });
  return (
    <Select
      {...rest}
      id={name}
      label={label}
      options={options}
      hint={hint}
      action={action}
      name={field.name}
      value={(field.value as string | undefined) ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
      error={fieldState.error?.message}
    />
  );
}
