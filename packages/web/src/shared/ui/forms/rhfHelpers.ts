import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import { z, type ZodTypeAny, type infer as ZodInfer } from "zod";

/**
 * Italian Zod error map. Translates the most common Zod issues to
 * user-facing Italian strings. Any custom message attached to the
 * issue (or returned by a `.refine()` call) wins; this map only kicks
 * in when no specific message is set on the schema.
 */
export const zodErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type: {
      // Missing required string/number/etc → "Campo obbligatorio"
      if (issue.received === "undefined" || issue.received === "null") {
        return { message: "Campo obbligatorio" };
      }
      return { message: ctx.defaultError };
    }
    case z.ZodIssueCode.too_small: {
      if (issue.type === "string") {
        if (typeof issue.minimum === "number" && issue.minimum <= 1) {
          return { message: "Campo obbligatorio" };
        }
        return { message: `Minimo ${String(issue.minimum)} caratteri` };
      }
      if (issue.type === "number" || issue.type === "bigint") {
        return { message: `Valore minimo: ${String(issue.minimum)}` };
      }
      if (issue.type === "array") {
        return { message: `Minimo ${String(issue.minimum)} elementi` };
      }
      return { message: ctx.defaultError };
    }
    case z.ZodIssueCode.too_big: {
      if (issue.type === "string") {
        return { message: `Massimo ${String(issue.maximum)} caratteri` };
      }
      if (issue.type === "number" || issue.type === "bigint") {
        return { message: `Valore massimo: ${String(issue.maximum)}` };
      }
      if (issue.type === "array") {
        return { message: `Massimo ${String(issue.maximum)} elementi` };
      }
      return { message: ctx.defaultError };
    }
    case z.ZodIssueCode.invalid_string: {
      if (issue.validation === "email") {
        return { message: "Email non valida" };
      }
      if (issue.validation === "url") {
        return { message: "URL non valido" };
      }
      return { message: "Valore non valido" };
    }
    case z.ZodIssueCode.invalid_enum_value: {
      return { message: "Valore non consentito" };
    }
    case z.ZodIssueCode.custom: {
      return { message: issue.message ?? "Valore non valido" };
    }
    default:
      return { message: ctx.defaultError };
  }
};

/**
 * Builds a react-hook-form resolver from a Zod schema, applying the
 * shared Italian error map. Wraps `zodResolver` so callers don't have
 * to remember to pass the error map every time.
 */
export function buildResolver<
  TSchema extends ZodTypeAny,
  TValues extends FieldValues = ZodInfer<TSchema>,
>(schema: TSchema): Resolver<TValues> {
  // @hookform/resolvers types `schemaOptions` very strictly across its v3 and
  // v4 overloads. At runtime only `errorMap` is read here, so we coerce via
  // `Function` to apply our shared Italian error map without inventing the
  // unused `path`/`async` ParseParams fields.
  const call = zodResolver as unknown as (
    s: unknown,
    opts: { errorMap: z.ZodErrorMap },
  ) => Resolver<TValues>;
  return call(schema, { errorMap: zodErrorMap });
}

/** Spec-aligned alias of {@link zodErrorMap}. */
export const italianErrorMap: z.ZodErrorMap = zodErrorMap;
