import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodErrorMap } from "../rhfHelpers";

function firstIssue(result: z.SafeParseReturnType<unknown, unknown>) {
  if (result.success) throw new Error("expected schema to fail");
  return result.error.issues[0]!;
}

describe("zodErrorMap", () => {
  it("translates invalid_type (missing required) to Italian", () => {
    const schema = z.object({ name: z.string() });
    const res = schema.safeParse({}, { errorMap: zodErrorMap });
    expect(firstIssue(res).message).toBe("Campo obbligatorio");
  });

  it("translates too_small string min(1) to Italian required", () => {
    const schema = z.object({ name: z.string().min(1) });
    const res = schema.safeParse({ name: "" }, { errorMap: zodErrorMap });
    expect(firstIssue(res).message).toBe("Campo obbligatorio");
  });

  it("translates too_small string min(>1) to character-count Italian", () => {
    const schema = z.object({ name: z.string().min(3) });
    const res = schema.safeParse({ name: "a" }, { errorMap: zodErrorMap });
    expect(firstIssue(res).message).toBe("Minimo 3 caratteri");
  });

  it("translates too_small number to value-min Italian", () => {
    const schema = z.object({ qty: z.number().min(5) });
    const res = schema.safeParse({ qty: 1 }, { errorMap: zodErrorMap });
    expect(firstIssue(res).message).toBe("Valore minimo: 5");
  });

  it("translates too_big string max to character-count Italian", () => {
    const schema = z.object({ name: z.string().max(3) });
    const res = schema.safeParse({ name: "abcd" }, { errorMap: zodErrorMap });
    expect(firstIssue(res).message).toBe("Massimo 3 caratteri");
  });

  it("translates too_big number to value-max Italian", () => {
    const schema = z.object({ qty: z.number().max(5) });
    const res = schema.safeParse({ qty: 10 }, { errorMap: zodErrorMap });
    expect(firstIssue(res).message).toBe("Valore massimo: 5");
  });

  it("translates invalid_string(email) to Italian", () => {
    const schema = z.object({ email: z.string().email() });
    const res = schema.safeParse({ email: "not-an-email" }, { errorMap: zodErrorMap });
    expect(firstIssue(res).message).toBe("Email non valida");
  });

  it("translates invalid_enum_value to Italian", () => {
    const schema = z.object({ color: z.enum(["red", "green"]) });
    const res = schema.safeParse({ color: "blue" }, { errorMap: zodErrorMap });
    expect(firstIssue(res).message).toBe("Valore non consentito");
  });

  it("falls through to message on custom issues", () => {
    const schema = z
      .object({ x: z.string() })
      .refine(() => false, { message: "Non valido (regola dominio)" });
    const res = schema.safeParse({ x: "a" }, { errorMap: zodErrorMap });
    expect(firstIssue(res).message).toBe("Non valido (regola dominio)");
  });
});
