import { useController, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { SegmentedControl } from "../SegmentedControl";

interface Segment<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface RHFSegmentedControlProps<TFieldValues extends FieldValues, T extends string> {
  name: Path<TFieldValues>;
  label: string;
  segments: ReadonlyArray<Segment<T>>;
  hint?: string;
}

export function RHFSegmentedControl<
  TFieldValues extends FieldValues,
  T extends string,
>({ name, label, segments, hint }: RHFSegmentedControlProps<TFieldValues, T>) {
  const { control } = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({ name, control });
  return (
    <SegmentedControl<T>
      label={label}
      segments={segments}
      value={(field.value as T) ?? segments[0]?.value ?? ("" as T)}
      onChange={(next) => field.onChange(next)}
      error={fieldState.error?.message}
      hint={hint}
    />
  );
}
