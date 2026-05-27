import { useController, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { RHFNumberField } from "../rhf/RHFNumberField";
import { RHFSegmentedControl } from "../rhf/RHFSegmentedControl";
import { RHFSelect } from "../rhf/RHFSelect";
import { RHFTextArea } from "../rhf/RHFTextArea";
import { RHFTextField } from "../rhf/RHFTextField";
import { Switch } from "../Switch";

type FieldCommon = {
  name: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
};

type TextFieldProps = FieldCommon & {
  kind: "text";
  type?: "text" | "email" | "tel" | "url" | "password" | "date" | "datetime-local";
  maxLength?: number;
  autoFocus?: boolean;
  placeholder?: string;
};

type NumberFieldProps = FieldCommon & {
  kind: "number";
  min?: number;
  max?: number;
  /** step. Default 10 for euro fields. */
  step?: number;
  placeholder?: string;
};

type SelectFieldProps = FieldCommon & {
  kind: "select";
  options: ReadonlyArray<{ value: string; label: string }>;
};

type TextAreaProps = FieldCommon & {
  kind: "textarea";
  maxLength?: number;
  rows?: number;
  placeholder?: string;
};

type SegmentedProps = FieldCommon & {
  kind: "segmented";
  options: ReadonlyArray<{ value: string; label: string }>;
};

type SwitchProps = FieldCommon & { kind: "switch" };

export type FieldProps =
  | TextFieldProps
  | NumberFieldProps
  | SelectFieldProps
  | TextAreaProps
  | SegmentedProps
  | SwitchProps;

export function Field(props: FieldProps): JSX.Element {
  switch (props.kind) {
    case "text":
      return renderText(props);
    case "number":
      return renderNumber(props);
    case "select":
      return renderSelect(props);
    case "textarea":
      return renderTextArea(props);
    case "segmented":
      return renderSegmented(props);
    case "switch":
      return renderSwitch(props);
  }
}

function renderText(p: TextFieldProps): JSX.Element {
  const passthrough: Record<string, unknown> = {};
  if (p.type !== undefined) passthrough["type"] = p.type;
  if (p.maxLength !== undefined) passthrough["maxLength"] = p.maxLength;
  if (p.autoFocus !== undefined) passthrough["autoFocus"] = p.autoFocus;
  if (p.placeholder !== undefined) passthrough["placeholder"] = p.placeholder;
  if (p.disabled !== undefined) passthrough["disabled"] = p.disabled;
  if (p.required !== undefined) passthrough["required"] = p.required;
  return (
    <RHFTextField<FieldValues>
      name={p.name as Path<FieldValues>}
      label={p.label}
      {...(p.hint !== undefined ? { hint: p.hint } : {})}
      {...passthrough}
    />
  );
}

function renderNumber(p: NumberFieldProps): JSX.Element {
  const step = p.step ?? 10;
  return (
    <RHFNumberField<FieldValues>
      name={p.name as Path<FieldValues>}
      label={p.label}
      step={step}
      {...(p.min !== undefined ? { min: p.min } : {})}
      {...(p.max !== undefined ? { max: p.max } : {})}
      {...(p.hint !== undefined ? { hint: p.hint } : {})}
      {...(p.disabled !== undefined ? { disabled: p.disabled } : {})}
    />
  );
}

function renderSelect(p: SelectFieldProps): JSX.Element {
  const passthrough: Record<string, unknown> = {};
  if (p.disabled !== undefined) passthrough["disabled"] = p.disabled;
  if (p.required !== undefined) passthrough["required"] = p.required;
  return (
    <RHFSelect<FieldValues>
      name={p.name as Path<FieldValues>}
      label={p.label}
      options={p.options}
      {...(p.hint !== undefined ? { hint: p.hint } : {})}
      {...passthrough}
    />
  );
}

function renderTextArea(p: TextAreaProps): JSX.Element {
  const passthrough: Record<string, unknown> = {};
  if (p.maxLength !== undefined) passthrough["maxLength"] = p.maxLength;
  if (p.rows !== undefined) passthrough["rows"] = p.rows;
  if (p.placeholder !== undefined) passthrough["placeholder"] = p.placeholder;
  if (p.disabled !== undefined) passthrough["disabled"] = p.disabled;
  if (p.required !== undefined) passthrough["required"] = p.required;
  return (
    <RHFTextArea<FieldValues>
      name={p.name as Path<FieldValues>}
      label={p.label}
      {...(p.hint !== undefined ? { hint: p.hint } : {})}
      {...passthrough}
    />
  );
}

function renderSegmented(p: SegmentedProps): JSX.Element {
  return (
    <RHFSegmentedControl<FieldValues, string>
      name={p.name as Path<FieldValues>}
      label={p.label}
      segments={p.options}
      {...(p.hint !== undefined ? { hint: p.hint } : {})}
    />
  );
}

function renderSwitch(p: SwitchProps): JSX.Element {
  return (
    <RHFSwitch
      name={p.name}
      label={p.label}
      {...(p.disabled !== undefined ? { disabled: p.disabled } : {})}
    />
  );
}

function RHFSwitch({
  name,
  label,
  disabled,
}: {
  name: string;
  label: string;
  disabled?: boolean;
}): JSX.Element {
  const { control } = useFormContext();
  const { field } = useController({ name, control });
  const value = Boolean(field.value);
  return (
    <Switch
      label={label}
      checked={value}
      onChange={(next) => field.onChange(next)}
      {...(disabled !== undefined ? { disabled } : {})}
    />
  );
}
