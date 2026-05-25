import { useController, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { NumberField } from "../NumberField";

interface RHFNumberFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  step?: number;
  min?: number;
  max?: number;
  hint?: string;
  suffix?: string;
  disabled?: boolean;
}

export function RHFNumberField<TFieldValues extends FieldValues>({
  name,
  label,
  step,
  min,
  max,
  hint,
  suffix,
  disabled,
}: RHFNumberFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({ name, control });
  const raw = field.value as number | string | undefined;
  const numericValue: number | "" =
    raw === undefined || raw === null || raw === "" ? "" : Number(raw);
  const valueProp: number | "" =
    typeof numericValue === "number" && Number.isFinite(numericValue)
      ? numericValue
      : "";
  return (
    <NumberField
      id={String(name)}
      label={label}
      name={field.name}
      value={valueProp}
      onChange={(v) => field.onChange(v === "" ? "" : String(v))}
      onBlur={field.onBlur}
      ref={field.ref}
      error={fieldState.error?.message}
      hint={hint}
      {...(step !== undefined ? { step } : {})}
      {...(min !== undefined ? { min } : {})}
      {...(max !== undefined ? { max } : {})}
      {...(suffix !== undefined ? { suffix } : {})}
      {...(disabled !== undefined ? { disabled } : {})}
    />
  );
}
