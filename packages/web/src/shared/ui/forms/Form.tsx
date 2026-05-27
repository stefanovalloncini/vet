import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import type { ZodTypeAny, infer as ZodInfer } from "zod";
import { buildResolver } from "./rhfHelpers";
import { useFormScrollOnError } from "./useFormScrollOnError";

type Mode = "onSubmit" | "onBlur" | "onChange";
type ReValidateMode = "onChange" | "onBlur" | "onSubmit";

export interface FormProps<
  TSchema extends ZodTypeAny,
  TValues extends FieldValues = ZodInfer<TSchema>,
> {
  schema: TSchema;
  defaultValues: TValues | (() => TValues | Promise<TValues>);
  onSubmit: SubmitHandler<TValues>;
  onValidationError?: SubmitErrorHandler<TValues>;
  id?: string;
  className?: string;
  children: ReactNode | ((methods: UseFormReturn<TValues>) => ReactNode);
  mode?: Mode;
  reValidateMode?: ReValidateMode;
  /** Disables submit-time error scroll. Default: enabled */
  disableScrollOnError?: boolean;
  /** When true, calls form.reset(defaultValues) on successful submit. Default false. */
  resetOnSuccess?: boolean;
}

export function Form<
  TSchema extends ZodTypeAny,
  TValues extends FieldValues = ZodInfer<TSchema>,
>({
  schema,
  defaultValues,
  onSubmit,
  onValidationError,
  id,
  className,
  children,
  mode = "onSubmit",
  reValidateMode,
  disableScrollOnError = false,
  resetOnSuccess = false,
}: FormProps<TSchema, TValues>) {
  // Resolve a possibly-async defaultValues factory. If a plain value is
  // provided we use it directly so the form is interactive on first render.
  const [resolvedDefaults, setResolvedDefaults] = useState<TValues | null>(
    typeof defaultValues === "function" ? null : (defaultValues as TValues),
  );

  useEffect(() => {
    if (typeof defaultValues !== "function") return;
    let cancelled = false;
    const result = (defaultValues as () => TValues | Promise<TValues>)();
    Promise.resolve(result).then((v) => {
      if (!cancelled) setResolvedDefaults(v);
    });
    return () => {
      cancelled = true;
    };
  }, [defaultValues]);

  if (resolvedDefaults === null) {
    return null;
  }

  return (
    <FormInner<TSchema, TValues>
      schema={schema}
      defaultValues={resolvedDefaults}
      onSubmit={onSubmit}
      {...(onValidationError ? { onValidationError } : {})}
      {...(id !== undefined ? { id } : {})}
      {...(className !== undefined ? { className } : {})}
      mode={mode}
      {...(reValidateMode !== undefined ? { reValidateMode } : {})}
      disableScrollOnError={disableScrollOnError}
      resetOnSuccess={resetOnSuccess}
    >
      {children}
    </FormInner>
  );
}

interface FormInnerProps<
  TSchema extends ZodTypeAny,
  TValues extends FieldValues,
> {
  schema: TSchema;
  defaultValues: TValues;
  onSubmit: SubmitHandler<TValues>;
  onValidationError?: SubmitErrorHandler<TValues>;
  id?: string;
  className?: string;
  children: ReactNode | ((methods: UseFormReturn<TValues>) => ReactNode);
  mode: Mode;
  reValidateMode?: ReValidateMode;
  disableScrollOnError: boolean;
  resetOnSuccess: boolean;
}

function FormInner<
  TSchema extends ZodTypeAny,
  TValues extends FieldValues,
>({
  schema,
  defaultValues,
  onSubmit,
  onValidationError,
  id,
  className,
  children,
  mode,
  reValidateMode,
  disableScrollOnError,
  resetOnSuccess,
}: FormInnerProps<TSchema, TValues>) {
  const resolver = useMemo(() => buildResolver<TSchema, TValues>(schema), [schema]);
  const methods = useForm<TValues>({
    resolver,
    defaultValues: defaultValues as DefaultValues<TValues>,
    mode,
    ...(reValidateMode !== undefined ? { reValidateMode } : {}),
  });

  const scrollHook = useFormScrollOnError<TValues>(onValidationError);
  const formRef = scrollHook.formRef;
  const onInvalid = disableScrollOnError
    ? (onValidationError ?? (() => {}))
    : scrollHook.onInvalid;

  const handleValid: SubmitHandler<TValues> = async (values, event) => {
    await onSubmit(values, event);
    if (resetOnSuccess) {
      methods.reset(defaultValues as DefaultValues<TValues>);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        ref={formRef}
        {...(id !== undefined ? { id } : {})}
        {...(className !== undefined ? { className } : {})}
        onSubmit={methods.handleSubmit(handleValid, onInvalid)}
        noValidate
      >
        {typeof children === "function" ? children(methods) : children}
      </form>
    </FormProvider>
  );
}
