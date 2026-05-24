import { z } from "zod";

export const SAFE_EMAIL_REGEX = /^[^=+\-@][^@]*@[^@]+\.[^@]+$/;
export const SAFE_NAME_PREFIX_REGEX = /^[^=+\-@]/;

export function safeEmail(max = 120) {
  return z.string().min(3).max(max).regex(SAFE_EMAIL_REGEX, "Email non valida");
}

export function safeName(max: number) {
  return z
    .string()
    .min(1)
    .max(max)
    .regex(SAFE_NAME_PREFIX_REGEX, "Nome non valido");
}
