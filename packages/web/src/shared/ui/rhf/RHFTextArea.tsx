import type { TextareaHTMLAttributes } from "react";
import { useController, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { TextArea } from "../TextArea";

interface RHFTextAreaProps<TFieldValues extends FieldValues>
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "defaultValue"> {
  name: Path<TFieldValues>;
  label: string;
  hint?: string;
}

export function RHFTextArea<TFieldValues extends FieldValues>({
  name,
  label,
  hint,
  ...rest
}: RHFTextAreaProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({ name, control });
  return (
    <TextArea
      {...rest}
      id={name}
      label={label}
      hint={hint}
      name={field.name}
      value={(field.value as string | undefined) ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
      error={fieldState.error?.message}
    />
  );
}
